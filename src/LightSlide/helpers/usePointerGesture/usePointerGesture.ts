import {useCallback, useMemo, useRef} from 'react';

import type {MouseEvent, MutableRefObject, PointerEvent, RefObject} from 'react';

import {DRAG_DIRECTION_LOCK_PX} from '../constants';
import type {LightSlideStore} from '../store';

/**
 * The pointer-event handler bag every gesture mode (drag-to-snap, flow drift, free momentum)
 * attaches to the viewport — the gesture surface. Identical shape for all three, so each
 * consumer returns it verbatim.
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
	 * Each move once a real main-axis drag is active, with the signed main-axis delta from the
	 * press point. Only fired after the direction lock resolves to the carousel's axis.
	 */
	onMove: (dx: number) => void;
	/**
	 * The gesture stopped moving: a pointerup, a mid-drag pointerleave, OR a pre-drag cross-axis
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
	storeRef: MutableRefObject<LightSlideStore>;
};

/**
 * Per-gesture scratch state, held in ONE ref (never React state): it mutates on every pointermove
 * (dozens/sec) and must never trigger a re-render — the whole "mutate the DOM transform during the
 * gesture" design depends on that.
 *
 * `startMain`/`startCross` anchor the press in the carousel's main/cross axis (clientX/clientY,
 * swapped when store.vertical); `dragging` flips true once a move clears the direction lock along
 * the main axis; `pointerId` is captured then (deferred so a tap still reaches child links);
 * `suppressClick` swallows the trailing click after a real drag; `velocity`/`lastMain`/`lastTime`
 * track flick speed for the snap decision. Shared by every gesture mode; the mode-specific
 * motion state (snap target, flow offset, coast physics, …) lives in the consumer's own ref.
 */
type GestureScratch = {
	startMain: number | null;
	startCross: number | null;
	dragging: boolean;
	pointerId: number | null;
	suppressClick: boolean;
	velocity: number;
	lastMain: number;
	lastTime: number;
};

const initialScratch = (): GestureScratch => ({
	startMain: null,
	startCross: null,
	dragging: false,
	pointerId: null,
	suppressClick: false,
	velocity: 0,
	lastMain: 0,
	lastTime: 0,
});

/**
 * The shared pointer-gesture engine behind useDragGesture, useFlow, and useFreeDrag. It owns the
 * parts that are identical across modes — the first-few-px direction lock (main-axis vs cross-axis
 * intent), deferred pointer capture, velocity tracking, swallowing the click that follows a real
 * drag, and the "pointer left the carousel mid-drag" safety net — and delegates the mode-specific
 * motion to the four callbacks. Returns the handler bag the consumer spreads onto the viewport
 * unchanged.
 *
 * Deltas and velocities cross the callback boundary in LOGICAL space: physical client coordinates
 * are resolved against the carousel's axis (clientX, or clientY when store.vertical — which also
 * inverts the direction lock, so a horizontal gesture over a vertical carousel releases to the
 * page) and multiplied by store.dirSign here, once, so under rtl a physically rightward swipe
 * arrives as a negative (forward) delta and none of the mode math ever sees the direction or the
 * axis.
 */
export function usePointerGesture({
	trackRef,
	storeRef,
	onStart,
	onMove,
	onEnd,
	onCancel,
}: PointerGestureParams): PointerHandlers {
	const g = useRef<GestureScratch>(initialScratch());

	/**
	 * Latest-ref the callbacks so the returned handlers stay referentially stable (their only deps
	 * are trackRef/storeRef) even though the consumer re-creates the closures each render. Same
	 * latest-ref pattern the hooks already use for prop knobs.
	 */
	const cb = useRef({onStart, onMove, onEnd, onCancel});
	cb.current = {onStart, onMove, onEnd, onCancel};

	const onPointerDown = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const s = g.current;
			const vertical = storeRef.current.vertical;
			s.startMain = vertical ? e.clientY : e.clientX;
			s.startCross = vertical ? e.clientX : e.clientY;
			s.dragging = false;
			s.suppressClick = false;
			s.pointerId = e.pointerId;
			s.velocity = 0;
			s.lastMain = s.startMain;
			s.lastTime = Date.now();
			/** Capture is deferred to the first real drag move so a tap reaches child links. */
			cb.current.onStart();
		},
		[storeRef],
	);

	const onPointerMove = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const s = g.current;
			if (s.startMain === null) return;

			const vertical = storeRef.current.vertical;
			const main = vertical ? e.clientY : e.clientX;
			const cross = vertical ? e.clientX : e.clientY;
			const dm = main - s.startMain;
			const dc = cross - (s.startCross ?? cross);

			if (!s.dragging) {
				if (
					Math.abs(dm) < DRAG_DIRECTION_LOCK_PX &&
					Math.abs(dc) < DRAG_DIRECTION_LOCK_PX
				)
					return;
				if (Math.abs(dc) > Math.abs(dm)) {
					/**
					 * Cross-axis intent → release for page scroll. No drag happened, so settle as a
					 * no-commit end (moved=false) and let the consumer resume its auto motion.
					 */
					s.startMain = null;
					cb.current.onEnd(0, 0, false);
					return;
				}
				s.dragging = true;
				/** Now a real main-axis drag — capture so moves keep coming if the finger leaves. */
				if (trackRef.current && s.pointerId !== null) {
					trackRef.current.setPointerCapture?.(s.pointerId);
				}
			}

			const now = Date.now();
			const dt = now - s.lastTime;
			if (dt > 0) s.velocity = (main - s.lastMain) / dt;
			s.lastTime = now;
			s.lastMain = main;

			cb.current.onMove(dm * storeRef.current.dirSign);
		},
		[trackRef, storeRef],
	);

	/**
	 * pointerup and the pointer-leave safety net share this: commit the gesture, or — for a tap
	 * with no real drag — just clean up (moved=false). A real drag also arms the click suppressor.
	 */
	const settle = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const s = g.current;
			if (s.startMain === null) return;
			const {dirSign, vertical} = storeRef.current;
			const moved = s.dragging;
			const dx = (vertical ? e.clientY : e.clientX) - s.startMain;
			s.startMain = null;
			s.dragging = false;
			if (moved) s.suppressClick = true;
			cb.current.onEnd(dx * dirSign, s.velocity * dirSign, moved);
		},
		[storeRef],
	);

	const onPointerUp = settle;

	/**
	 * Safety net for "release outside the carousel leaves the gesture stuck": while the pointer is
	 * captured this never fires, but if capture didn't engage a pointer leaving mid-drag would
	 * otherwise hang the gesture forever. Treat it as a normal release.
	 */
	const onPointerLeave = settle;

	const onPointerCancel = useCallback(() => {
		const s = g.current;
		s.startMain = null;
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
	 * The bag itself is memoized (every member is already stable): the flow and free seams hand
	 * it across the plugin boundary and the track spread stays diff-stable between renders.
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
