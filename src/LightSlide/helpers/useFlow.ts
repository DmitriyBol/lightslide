import {useCallback, useEffect, useLayoutEffect, useRef} from 'react';

import type {
	MouseEvent,
	MutableRefObject,
	PointerEvent,
	RefObject,
} from 'react';

import {DRAG_DIRECTION_LOCK_PX} from './constants';
import type {LightSlideStore} from './store';

type FlowParams = {
	enabled: boolean;
	speed: number; // resolved px per second
	resumeDelay: number; // resolved ms
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
};

type FlowHandlers = {
	onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerCancel: () => void;
	onPointerLeave: (e: PointerEvent<HTMLDivElement>) => void;
	onClickCapture: (e: MouseEvent<HTMLDivElement>) => void;
};

/**
 * Per-instance flow state, held in ONE ref (mirrors useDragGesture's `drag`): the rAF loop
 * mutates `offset`/`lastTs` every frame and the drag fields mutate on every pointermove, so
 * none of it may live in React state or trigger a re-render. The fields shared with a drag
 * gesture (startX, startY, dragging, pointerId, suppressClick) keep the same names as DragState
 * for cross-hook uniformity.
 *
 * `offset` is the current scroll offset in px (advanced by the loop, wrapped at one content
 * width); `raf` is the running requestAnimationFrame handle; `lastTs` is the previous frame's
 * timestamp for dt-based (frame-rate-independent) motion; `resumeTimer` restarts the drift
 * resumeDelay ms after an interaction ends; `interacting` pauses the drift while the user is
 * engaged; `offsetAtStart` is the offset captured at drag start so the strip drifts from where
 * it was grabbed.
 */
type FlowState = {
	offset: number;
	raf: number | null;
	lastTs: number | null;
	resumeTimer: ReturnType<typeof setTimeout> | null;
	interacting: boolean;
	startX: number | null;
	startY: number | null;
	dragging: boolean;
	offsetAtStart: number;
	pointerId: number | null;
	suppressClick: boolean;
};

const initialFlowState = (): FlowState => ({
	offset: 0,
	raf: null,
	lastTs: null,
	resumeTimer: null,
	interacting: false,
	startX: null,
	startY: null,
	dragging: false,
	offsetAtStart: 0,
	pointerId: null,
	suppressClick: false,
});

const wrap = (value: number, span: number) =>
	span > 0 ? ((value % span) + span) % span : 0;

// Continuous ticker scroll. A requestAnimationFrame loop advances a px offset at
// `speed` px/s and writes it straight to the track transform (no CSS transition →
// smooth at frame rate). The loop clones make the wrap seamless: when the offset
// passes one full content width the modulo lands on a clone that is pixel-identical
// to the start, so there is no visible jump. Interaction pauses the motion and a
// drag drifts the strip from its current position; motion resumes resumeDelay ms
// after the interaction ends, continuing from wherever it stopped (no snap, no jank).
export function useFlow({
	enabled,
	speed,
	resumeDelay,
	trackRef,
	storeRef,
}: FlowParams): FlowHandlers {
	const flow = useRef<FlowState>(initialFlowState());

	// Latest-refs of the prop knobs so changing speed/resumeDelay never restarts the rAF
	// loop. Kept separate from the flow scratch state, the same way LightSlide keeps its
	// analytics latest-ref out of the core store.
	const speedRef = useRef(speed);
	speedRef.current = speed;
	const resumeDelayRef = useRef(resumeDelay);
	resumeDelayRef.current = resumeDelay;

	const applyTransform = useCallback(
		(sw: number) => {
			const track = trackRef.current;
			if (!track) return;
			const base = storeRef.current.loopOffset * sw;
			track.style.transition = '';
			track.style.transform = `translateX(${-(base + flow.current.offset)}px)`;
		},
		[trackRef, storeRef],
	);

	const clearResumeTimer = useCallback(() => {
		if (flow.current.resumeTimer !== null) {
			clearTimeout(flow.current.resumeTimer);
			flow.current.resumeTimer = null;
		}
	}, []);

	const scheduleResume = useCallback(() => {
		clearResumeTimer();
		flow.current.resumeTimer = setTimeout(() => {
			flow.current.resumeTimer = null;
			flow.current.interacting = false;
		}, resumeDelayRef.current);
	}, [clearResumeTimer]);

	// Position at the home offset before first paint, so the prepend clones never flash.
	// useSlideMetrics' layout effect runs first and seeds store.slideWidth, so it is ready.
	useLayoutEffect(() => {
		if (!enabled) return;
		const sw = storeRef.current.slideWidth;
		if (sw > 0) applyTransform(sw);
	}, [enabled, applyTransform, storeRef]);

	useEffect(() => {
		if (!enabled) return;
		// flow.current is stable for the component's life (never reassigned), so capturing it
		// once is safe and lets the cleanup read the latest raf id without an exhaustive-deps
		// warning about ref.current in cleanup.
		const f = flow.current;

		const step = (ts: number) => {
			if (f.lastTs === null) f.lastTs = ts;
			const dt = ts - f.lastTs;
			f.lastTs = ts;

			// Read the cached slide width from the store — NEVER offsetWidth — so the hot
			// loop forces no layout/reflow per frame. (Reading offsetWidth here is what made
			// flow stutter once mounted in a heavy host page: every frame triggered a full
			// document reflow. The width only changes on resize, where the ResizeObserver
			// refreshes store.slideWidth for us.)
			const sw = storeRef.current.slideWidth;
			if (!f.interacting && sw > 0) {
				const span = storeRef.current.slideCount * sw;
				f.offset = wrap(f.offset + (speedRef.current * dt) / 1000, span);
				applyTransform(sw);
			}

			f.raf = requestAnimationFrame(step);
		};

		f.raf = requestAnimationFrame(step);
		return () => {
			if (f.raf !== null) cancelAnimationFrame(f.raf);
			f.raf = null;
			f.lastTs = null;
			clearResumeTimer();
		};
	}, [enabled, applyTransform, storeRef, clearResumeTimer]);

	const onPointerDown = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const f = flow.current;
			f.interacting = true;
			clearResumeTimer();
			f.startX = e.clientX;
			f.startY = e.clientY;
			f.dragging = false;
			f.suppressClick = false;
			f.pointerId = e.pointerId;
			f.offsetAtStart = f.offset;
			// Capture is deferred to the first real drag move so a tap reaches child links.
		},
		[clearResumeTimer],
	);

	const onPointerMove = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const f = flow.current;
			if (f.startX === null) return;

			const dx = e.clientX - f.startX;
			const dy = e.clientY - (f.startY ?? e.clientY);

			if (!f.dragging) {
				if (
					Math.abs(dx) < DRAG_DIRECTION_LOCK_PX &&
					Math.abs(dy) < DRAG_DIRECTION_LOCK_PX
				)
					return;
				if (Math.abs(dy) > Math.abs(dx)) {
					// Vertical intent → release for page scroll and let the flow resume.
					f.startX = null;
					scheduleResume();
					return;
				}
				f.dragging = true;
				if (trackRef.current && f.pointerId !== null) {
					trackRef.current.setPointerCapture?.(f.pointerId);
				}
			}

			const track = trackRef.current;
			if (track) {
				const sw = storeRef.current.slideWidth;
				const base = storeRef.current.loopOffset * sw;
				track.style.transition = '';
				track.style.transform = `translateX(${-(base + f.offsetAtStart) + dx}px)`;
			}
		},
		[trackRef, storeRef, scheduleResume],
	);

	const endInteraction = useCallback(
		(commit: boolean, dx: number) => {
			const f = flow.current;
			if (commit && f.dragging) {
				const sw = storeRef.current.slideWidth;
				f.offset = wrap(f.offsetAtStart - dx, storeRef.current.slideCount * sw);
				applyTransform(sw);
				// A real drag just ended — swallow the trailing click so it does not also
				// activate a link/button under the release point.
				f.suppressClick = true;
			}
			f.startX = null;
			f.dragging = false;
			scheduleResume();
		},
		[applyTransform, storeRef, scheduleResume],
	);

	const onPointerUp = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const f = flow.current;
			const dx = f.startX === null ? 0 : e.clientX - f.startX;
			endInteraction(true, dx);
		},
		[endInteraction],
	);

	const onPointerCancel = useCallback(() => {
		endInteraction(false, 0);
	}, [endInteraction]);

	// Safety net for a pointer that leaves the carousel mid-drag without a release event
	// (capture suppresses this while engaged, so it only fires when capture didn't hold):
	// commit the drift so the flow is never left paused/stuck.
	const onPointerLeave = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const f = flow.current;
			if (f.startX === null) return;
			endInteraction(true, e.clientX - f.startX);
		},
		[endInteraction],
	);

	// Capture-phase guard: only the click that immediately follows a real drag is
	// cancelled; ordinary taps fall through untouched (links remain clickable).
	const onClickCapture = useCallback((e: MouseEvent<HTMLDivElement>) => {
		if (!flow.current.suppressClick) return;
		flow.current.suppressClick = false;
		e.preventDefault();
		e.stopPropagation();
	}, []);

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onPointerLeave,
		onClickCapture,
	};
}
