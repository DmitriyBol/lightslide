import {useCallback, useMemo, useRef} from 'react';

import type {MouseEvent, PointerEvent, RefObject} from 'react';

import {DRAG_DIRECTION_LOCK_PX} from './constants';

/**
 * The pointer-event handler bag both gesture modes (drag-to-snap and flow drift) attach to the
 * track. Identical shape for both, so each consumer returns it verbatim.
 */
export type PointerHandlers = {
	onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerCancel: () => void;
	onPointerLeave: (e: PointerEvent<HTMLDivElement>) => void;
	onClickCapture: (e: MouseEvent<HTMLDivElement>) => void;
};

/**
 * The mode-specific behaviour the primitive delegates to. Everything *generic* about a pointer
 * drag — direction locking, deferred capture, velocity, click suppression, the leave safety net —
 * lives in the primitive; these four say what to actually do with the gesture.
 */
type PointerGestureCallbacks = {
	/** pointerdown: record starting state (pause auto motion, capture the current offset, …). */
	onStart: () => void;
	/**
	 * Each move once a real horizontal drag is active, with the signed horizontal delta from the
	 * press point. Only fired after the direction lock resolves to horizontal.
	 */
	onMove: (dx: number) => void;
	/**
	 * The gesture stopped moving: a pointerup, a mid-drag pointerleave, OR a pre-drag vertical
	 * abandon (page-scroll intent). The abandon and a plain tap both arrive as `moved === false`
	 * — "nothing to commit, just clean up". `dx`/`velocityX` are the release delta/speed.
	 */
	onEnd: (dx: number, velocityX: number, moved: boolean) => void;
	/**
	 * pointercancel: abort and return to rest. Fires unconditionally (even with no active gesture)
	 * so the consumer can always re-settle the track.
	 */
	onCancel: () => void;
};

type PointerGestureParams = PointerGestureCallbacks & {
	trackRef: RefObject<HTMLDivElement>;
};

/**
 * Per-gesture scratch state, held in ONE ref (never React state): it mutates on every pointermove
 * (dozens/sec) and must never trigger a re-render — the whole "mutate the DOM transform during the
 * gesture" design depends on that. Shared by both gesture modes; the mode-specific motion state
 * (snap target, flow offset, …) lives in the consumer's own ref.
 *
 * `startX`/`startY` anchor the press; `dragging` flips true once a move clears the direction lock
 * as horizontal; `pointerId` is captured then (deferred so a tap still reaches child links);
 * `suppressClick` swallows the trailing click after a real drag; `velocityX`/`lastX`/`lastTime`
 * track flick speed for the snap decision.
 */
type GestureScratch = {
	startX: number | null;
	startY: number | null;
	dragging: boolean;
	pointerId: number | null;
	suppressClick: boolean;
	velocityX: number;
	lastX: number;
	lastTime: number;
};

const initialScratch = (): GestureScratch => ({
	startX: null,
	startY: null,
	dragging: false,
	pointerId: null,
	suppressClick: false,
	velocityX: 0,
	lastX: 0,
	lastTime: 0,
});

/**
 * The shared pointer-gesture engine behind both useDragGesture and useFlow. It owns the parts that
 * are identical across modes — the first-few-px direction lock (horizontal vs vertical intent),
 * deferred pointer capture, velocity tracking, swallowing the click that follows a real drag, and
 * the "pointer left the carousel mid-drag" safety net — and delegates the mode-specific motion to
 * the four callbacks. Returns the handler bag the consumer spreads onto the track unchanged.
 */
export function usePointerGesture({
	trackRef,
	onStart,
	onMove,
	onEnd,
	onCancel,
}: PointerGestureParams): PointerHandlers {
	const g = useRef<GestureScratch>(initialScratch());

	/**
	 * Latest-ref the callbacks so the returned handlers stay referentially stable (their only dep
	 * is trackRef) even though the consumer re-creates the closures each render. Same latest-ref
	 * pattern the hooks already use for prop knobs.
	 */
	const cb = useRef({onStart, onMove, onEnd, onCancel});
	cb.current = {onStart, onMove, onEnd, onCancel};

	const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
		const s = g.current;
		s.startX = e.clientX;
		s.startY = e.clientY;
		s.dragging = false;
		s.suppressClick = false;
		s.pointerId = e.pointerId;
		s.velocityX = 0;
		s.lastX = e.clientX;
		s.lastTime = Date.now();
		/** Capture is deferred to the first real drag move so a tap reaches child links. */
		cb.current.onStart();
	}, []);

	const onPointerMove = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const s = g.current;
			if (s.startX === null) return;

			const dx = e.clientX - s.startX;
			const dy = e.clientY - (s.startY ?? e.clientY);

			if (!s.dragging) {
				if (
					Math.abs(dx) < DRAG_DIRECTION_LOCK_PX &&
					Math.abs(dy) < DRAG_DIRECTION_LOCK_PX
				)
					return;
				if (Math.abs(dy) > Math.abs(dx)) {
					/**
					 * Vertical intent → release for page scroll. No drag happened, so settle as a
					 * no-commit end (moved=false) and let the consumer resume its auto motion.
					 */
					s.startX = null;
					cb.current.onEnd(0, 0, false);
					return;
				}
				s.dragging = true;
				/** Now a real horizontal drag — capture so moves keep coming if the finger leaves. */
				if (trackRef.current && s.pointerId !== null) {
					trackRef.current.setPointerCapture?.(s.pointerId);
				}
			}

			const now = Date.now();
			const dt = now - s.lastTime;
			if (dt > 0) s.velocityX = (e.clientX - s.lastX) / dt;
			s.lastTime = now;
			s.lastX = e.clientX;

			cb.current.onMove(dx);
		},
		[trackRef],
	);

	/**
	 * pointerup and the pointer-leave safety net share this: commit the gesture, or — for a tap
	 * with no real drag — just clean up (moved=false). A real drag also arms the click suppressor.
	 */
	const settle = useCallback((endX: number) => {
		const s = g.current;
		if (s.startX === null) return;
		const moved = s.dragging;
		const dx = endX - s.startX;
		s.startX = null;
		s.dragging = false;
		if (moved) s.suppressClick = true;
		cb.current.onEnd(dx, s.velocityX, moved);
	}, []);

	const onPointerUp = useCallback(
		(e: PointerEvent<HTMLDivElement>) => settle(e.clientX),
		[settle],
	);

	/**
	 * Safety net for "release outside the carousel leaves the gesture stuck": while the pointer is
	 * captured this never fires, but if capture didn't engage a pointer leaving mid-drag would
	 * otherwise hang the gesture forever. Treat it as a normal release.
	 */
	const onPointerLeave = useCallback(
		(e: PointerEvent<HTMLDivElement>) => settle(e.clientX),
		[settle],
	);

	const onPointerCancel = useCallback(() => {
		const s = g.current;
		s.startX = null;
		s.dragging = false;
		cb.current.onCancel();
	}, []);

	/**
	 * Capture-phase guard: only the click that immediately follows a real drag is cancelled;
	 * ordinary taps fall through untouched (links stay clickable).
	 */
	const onClickCapture = useCallback((e: MouseEvent<HTMLDivElement>) => {
		if (!g.current.suppressClick) return;
		g.current.suppressClick = false;
		e.preventDefault();
		e.stopPropagation();
	}, []);

	/**
	 * The bag itself is memoized (every member is already stable): the flow seam hands it
	 * across the plugin boundary and the track spread stays diff-stable between renders.
	 */
	return useMemo(
		() => ({
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel,
			onPointerLeave,
			onClickCapture,
		}),
		[
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel,
			onPointerLeave,
			onClickCapture,
		],
	);
}
