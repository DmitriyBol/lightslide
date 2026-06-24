import {useCallback, useEffect, useLayoutEffect, useRef} from 'react';

import type {
	MouseEvent,
	MutableRefObject,
	PointerEvent,
	RefObject,
} from 'react';

import {DRAG_DIRECTION_LOCK_PX} from './constants';

type FlowParams = {
	enabled: boolean;
	speed: number; // resolved px per second
	resumeDelay: number; // resolved ms
	trackRef: RefObject<HTMLDivElement>;
	slideCountRef: MutableRefObject<number>;
	loopOffsetRef: MutableRefObject<number>;
	getComputedSlideWidth: () => number;
};

type FlowHandlers = {
	onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerCancel: () => void;
	onClickCapture: (e: MouseEvent<HTMLDivElement>) => void;
};

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
	slideCountRef,
	loopOffsetRef,
	getComputedSlideWidth,
}: FlowParams): FlowHandlers {
	const offsetRef = useRef(0);
	const rafRef = useRef<number | null>(null);
	const lastTsRef = useRef<number | null>(null);
	const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const interactingRef = useRef(false);

	const dragStartXRef = useRef<number | null>(null);
	const dragStartYRef = useRef<number | null>(null);
	const isDraggingRef = useRef(false);
	const offsetAtDragStartRef = useRef(0);
	const pointerIdRef = useRef<number | null>(null);
	const suppressClickRef = useRef(false);

	// Latest-ref so changing speed/resumeDelay never restarts the rAF loop.
	const speedRef = useRef(speed);
	speedRef.current = speed;
	const resumeDelayRef = useRef(resumeDelay);
	resumeDelayRef.current = resumeDelay;

	const contentWidth = useCallback(
		() => slideCountRef.current * getComputedSlideWidth(),
		[slideCountRef, getComputedSlideWidth],
	);

	const applyTransform = useCallback(() => {
		const track = trackRef.current;
		if (!track) return;
		const sw = getComputedSlideWidth();
		const base = loopOffsetRef.current * sw;
		track.style.transition = '';
		track.style.transform = `translateX(${-(base + offsetRef.current)}px)`;
	}, [trackRef, loopOffsetRef, getComputedSlideWidth]);

	const clearResumeTimer = useCallback(() => {
		if (resumeTimerRef.current !== null) {
			clearTimeout(resumeTimerRef.current);
			resumeTimerRef.current = null;
		}
	}, []);

	const scheduleResume = useCallback(() => {
		clearResumeTimer();
		resumeTimerRef.current = setTimeout(() => {
			resumeTimerRef.current = null;
			interactingRef.current = false;
		}, resumeDelayRef.current);
	}, [clearResumeTimer]);

	// Position at the home offset before first paint, so the prepend clones never flash.
	useLayoutEffect(() => {
		if (!enabled) return;
		if (getComputedSlideWidth() > 0) applyTransform();
	}, [enabled, applyTransform, getComputedSlideWidth]);

	useEffect(() => {
		if (!enabled) return;

		const step = (ts: number) => {
			if (lastTsRef.current === null) lastTsRef.current = ts;
			const dt = ts - lastTsRef.current;
			lastTsRef.current = ts;

			const sw = getComputedSlideWidth();
			if (!interactingRef.current && sw > 0) {
				offsetRef.current = wrap(
					offsetRef.current + (speedRef.current * dt) / 1000,
					contentWidth(),
				);
				applyTransform();
			}

			rafRef.current = requestAnimationFrame(step);
		};

		rafRef.current = requestAnimationFrame(step);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			lastTsRef.current = null;
			clearResumeTimer();
		};
	}, [
		enabled,
		applyTransform,
		contentWidth,
		getComputedSlideWidth,
		clearResumeTimer,
	]);

	const onPointerDown = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			interactingRef.current = true;
			clearResumeTimer();
			dragStartXRef.current = e.clientX;
			dragStartYRef.current = e.clientY;
			isDraggingRef.current = false;
			suppressClickRef.current = false;
			pointerIdRef.current = e.pointerId;
			offsetAtDragStartRef.current = offsetRef.current;
			// Capture is deferred to the first real drag move so a tap reaches child links.
		},
		[clearResumeTimer],
	);

	const onPointerMove = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			if (dragStartXRef.current === null) return;

			const dx = e.clientX - dragStartXRef.current;
			const dy = e.clientY - (dragStartYRef.current ?? e.clientY);

			if (!isDraggingRef.current) {
				if (
					Math.abs(dx) < DRAG_DIRECTION_LOCK_PX &&
					Math.abs(dy) < DRAG_DIRECTION_LOCK_PX
				)
					return;
				if (Math.abs(dy) > Math.abs(dx)) {
					// Vertical intent → release for page scroll and let the flow resume.
					dragStartXRef.current = null;
					scheduleResume();
					return;
				}
				isDraggingRef.current = true;
				if (trackRef.current && pointerIdRef.current !== null) {
					trackRef.current.setPointerCapture?.(pointerIdRef.current);
				}
			}

			const track = trackRef.current;
			if (track) {
				const sw = getComputedSlideWidth();
				const base = loopOffsetRef.current * sw;
				track.style.transition = '';
				track.style.transform = `translateX(${-(base + offsetAtDragStartRef.current) + dx}px)`;
			}
		},
		[trackRef, loopOffsetRef, getComputedSlideWidth, scheduleResume],
	);

	const endInteraction = useCallback(
		(commit: boolean, dx: number) => {
			if (commit && isDraggingRef.current) {
				offsetRef.current = wrap(
					offsetAtDragStartRef.current - dx,
					contentWidth(),
				);
				applyTransform();
				// A real drag just ended — swallow the trailing click so it does not also
				// activate a link/button under the release point.
				suppressClickRef.current = true;
			}
			dragStartXRef.current = null;
			isDraggingRef.current = false;
			scheduleResume();
		},
		[applyTransform, contentWidth, scheduleResume],
	);

	const onPointerUp = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const dx =
				dragStartXRef.current === null ? 0 : e.clientX - dragStartXRef.current;
			endInteraction(true, dx);
		},
		[endInteraction],
	);

	const onPointerCancel = useCallback(() => {
		endInteraction(false, 0);
	}, [endInteraction]);

	// Capture-phase guard: only the click that immediately follows a real drag is
	// cancelled; ordinary taps fall through untouched (links remain clickable).
	const onClickCapture = useCallback((e: MouseEvent<HTMLDivElement>) => {
		if (!suppressClickRef.current) return;
		suppressClickRef.current = false;
		e.preventDefault();
		e.stopPropagation();
	}, []);

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onClickCapture,
	};
}
