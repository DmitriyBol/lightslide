import {useCallback, useEffect, useLayoutEffect, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from './store';
import type {PointerHandlers} from './usePointerGesture';
import {usePointerGesture} from './usePointerGesture';

/** `speed` is the resolved px per second, `resumeDelay` the resolved ms. */
type FlowParams = {
	enabled: boolean;
	speed: number;
	resumeDelay: number;
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
};

/**
 * Per-instance flow (drift) state, held in ONE ref: the rAF loop mutates `offset`/`lastTs` every
 * frame, so none of it may live in React state or trigger a re-render. The pointer-gesture scratch
 * (startX, dragging, pointerId, …) now lives in usePointerGesture — this holds only the drift.
 *
 * `offset` is the current scroll offset in px (advanced by the loop, wrapped at one content width);
 * `raf` is the running requestAnimationFrame handle; `lastTs` is the previous frame's timestamp for
 * dt-based (frame-rate-independent) motion; `resumeTimer` restarts the drift resumeDelay ms after an
 * interaction ends; `interacting` pauses the drift while the user is engaged; `offsetAtStart` is the
 * offset captured at drag start so the strip drifts from where it was grabbed.
 */
type FlowState = {
	offset: number;
	raf: number | null;
	lastTs: number | null;
	resumeTimer: ReturnType<typeof setTimeout> | null;
	interacting: boolean;
	offsetAtStart: number;
};

const initialFlowState = (): FlowState => ({
	offset: 0,
	raf: null,
	lastTs: null,
	resumeTimer: null,
	interacting: false,
	offsetAtStart: 0,
});

const wrap = (value: number, span: number) =>
	span > 0 ? ((value % span) + span) % span : 0;

/**
 * Continuous ticker scroll. A requestAnimationFrame loop advances a px offset at `speed` px/s and
 * writes it straight to the track transform (no CSS transition → smooth at frame rate). The loop
 * clones make the wrap seamless: when the offset passes one full content width the modulo lands on
 * a clone that is pixel-identical to the start, so there is no visible jump. The drag mechanics are
 * shared with useDragGesture via usePointerGesture; here a drag just drifts the strip from its
 * current position, and motion resumes resumeDelay ms after the interaction ends, continuing from
 * wherever it stopped (no snap, no jank).
 */
export function useFlow({
	enabled,
	speed,
	resumeDelay,
	trackRef,
	storeRef,
}: FlowParams): PointerHandlers {
	const flow = useRef<FlowState>(initialFlowState());

	/** Latest-refs of the prop knobs so changing speed/resumeDelay never restarts the rAF loop. */
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

	/**
	 * Position at the home offset before first paint, so the prepend clones never flash.
	 * useSlideMetrics' layout effect runs first and seeds store.slideWidth, so it is ready.
	 */
	useLayoutEffect(() => {
		if (!enabled) return;
		const sw = storeRef.current.slideWidth;
		if (sw > 0) applyTransform(sw);
	}, [enabled, applyTransform, storeRef]);

	useEffect(() => {
		if (!enabled) return;
		/**
		 * flow.current is stable for the component's life (never reassigned), so capturing it once
		 * is safe and lets the cleanup read the latest raf id without an exhaustive-deps warning.
		 */
		const f = flow.current;

		const step = (ts: number) => {
			if (f.lastTs === null) f.lastTs = ts;
			const dt = ts - f.lastTs;
			f.lastTs = ts;

			/**
			 * Read the cached slide width from the store — NEVER offsetWidth — so the hot loop
			 * forces no layout/reflow per frame. The width only changes on resize, where the
			 * ResizeObserver refreshes store.slideWidth for us.
			 */
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

	const onStart = useCallback(() => {
		const f = flow.current;
		f.interacting = true;
		clearResumeTimer();
		f.offsetAtStart = f.offset;
	}, [clearResumeTimer]);

	const onMove = useCallback(
		(dx: number) => {
			const track = trackRef.current;
			if (!track) return;
			const sw = storeRef.current.slideWidth;
			const base = storeRef.current.loopOffset * sw;
			track.style.transition = '';
			track.style.transform = `translateX(${-(base + flow.current.offsetAtStart) + dx}px)`;
		},
		[trackRef, storeRef],
	);

	const onEnd = useCallback(
		(dx: number, _velocityX: number, moved: boolean) => {
			if (moved) {
				const sw = storeRef.current.slideWidth;
				flow.current.offset = wrap(
					flow.current.offsetAtStart - dx,
					storeRef.current.slideCount * sw,
				);
				applyTransform(sw);
			}
			/** Resume the drift after the delay whether this was a real drag or a tap. */
			scheduleResume();
		},
		[storeRef, applyTransform, scheduleResume],
	);

	const onCancel = useCallback(() => {
		scheduleResume();
	}, [scheduleResume]);

	return usePointerGesture({trackRef, onStart, onMove, onEnd, onCancel});
}
