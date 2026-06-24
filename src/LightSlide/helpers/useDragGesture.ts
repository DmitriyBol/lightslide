import {useCallback, useRef} from 'react';

import type {
	MouseEvent,
	MutableRefObject,
	PointerEvent,
	RefObject,
} from 'react';

import {getSnapIndex} from '../../utils/swipe';
import {DRAG_DIRECTION_LOCK_PX, RUBBER_BAND_DIVISOR} from './constants';
import type {NavigateFn} from './navigation';

type DragGestureParams = {
	trackRef: RefObject<HTMLDivElement>;
	currentIndexRef: MutableRefObject<number>;
	maxIndexRef: MutableRefObject<number>;
	isLoopRef: MutableRefObject<boolean>;
	loopOffsetRef: MutableRefObject<number>;
	autoScrollPausedRef: MutableRefObject<boolean>;
	getComputedSlideWidth: () => number;
	snapToVisual: (
		visualIndex: number,
		animate: boolean,
		onComplete?: () => void,
	) => void;
	navigateToIndex: NavigateFn;
};

type DragHandlers = {
	onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerCancel: () => void;
	onClickCapture: (e: MouseEvent<HTMLDivElement>) => void;
};

// Per-gesture scratch state. Kept in ONE ref (not React state, not eight separate refs):
// it mutates on every pointermove (dozens/sec) and must never trigger a re-render — the
// whole "DOM-mutate during the gesture" design depends on that. The shared cross-hook refs
// (currentIndexRef, maxIndexRef, …) are passed in; they are the latest-ref pattern and stay
// separate because other hooks own/read them.
type DragState = {
	startX: number | null;
	startY: number | null;
	dragging: boolean;
	velocityX: number;
	lastX: number;
	lastTime: number;
	pointerId: number | null;
	suppressClick: boolean;
};

const initialDragState = (): DragState => ({
	startX: null,
	startY: null,
	dragging: false,
	velocityX: 0,
	lastX: 0,
	lastTime: 0,
	pointerId: null,
	suppressClick: false,
});

// Owns the drag scratch state and mutates the track transform directly during the gesture
// (zero re-renders). Commits the snap decision through navigateToIndex on release.
// Direction-locks to horizontal on the first few px; vertical intent cancels.
//
// Click handling: the pointer is captured only once a real horizontal drag begins (not on
// pointerdown), so a plain tap on a link/button inside a slide reaches its target normally.
// After an actual drag the trailing `click` is swallowed in the capture phase so a drag that
// ends over an interactive element does not also activate it.
export function useDragGesture({
	trackRef,
	currentIndexRef,
	maxIndexRef,
	isLoopRef,
	loopOffsetRef,
	autoScrollPausedRef,
	getComputedSlideWidth,
	snapToVisual,
	navigateToIndex,
}: DragGestureParams): DragHandlers {
	const drag = useRef<DragState>(initialDragState());

	const visualIndexOf = useCallback(
		(logicalIndex: number) =>
			isLoopRef.current ? logicalIndex + loopOffsetRef.current : logicalIndex,
		[isLoopRef, loopOffsetRef],
	);

	const onPointerDown = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const d = drag.current;
			d.startX = e.clientX;
			d.startY = e.clientY;
			d.dragging = false;
			d.suppressClick = false;
			d.pointerId = e.pointerId;
			d.velocityX = 0;
			d.lastX = e.clientX;
			d.lastTime = Date.now();
			autoScrollPausedRef.current = true;
			// Capture is deferred to the first real drag move so a tap reaches child links.
			if (trackRef.current) trackRef.current.style.transition = '';
		},
		[trackRef, autoScrollPausedRef],
	);

	const onPointerMove = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const d = drag.current;
			if (d.startX === null) return;

			const dx = e.clientX - d.startX;
			const dy = e.clientY - (d.startY ?? e.clientY);

			if (!d.dragging) {
				if (
					Math.abs(dx) < DRAG_DIRECTION_LOCK_PX &&
					Math.abs(dy) < DRAG_DIRECTION_LOCK_PX
				)
					return;
				if (Math.abs(dy) > Math.abs(dx)) {
					d.startX = null;
					autoScrollPausedRef.current = false;
					return;
				}
				d.dragging = true;
				// Now that it is a real horizontal drag, capture the pointer so moves keep
				// coming if the finger leaves the element.
				if (trackRef.current && d.pointerId !== null) {
					trackRef.current.setPointerCapture?.(d.pointerId);
				}
			}

			const now = Date.now();
			const dt = now - d.lastTime;
			if (dt > 0) d.velocityX = (e.clientX - d.lastX) / dt;
			d.lastTime = now;
			d.lastX = e.clientX;

			const atStart =
				!isLoopRef.current && currentIndexRef.current <= 0 && dx > 0;
			const atEnd =
				!isLoopRef.current &&
				currentIndexRef.current >= maxIndexRef.current &&
				dx < 0;
			const delta = atStart || atEnd ? dx / RUBBER_BAND_DIVISOR : dx;

			if (trackRef.current) {
				const sw = getComputedSlideWidth();
				const visualIndex = visualIndexOf(currentIndexRef.current);
				trackRef.current.style.transform = `translateX(${-visualIndex * sw + delta}px)`;
			}
		},
		[
			getComputedSlideWidth,
			visualIndexOf,
			trackRef,
			currentIndexRef,
			maxIndexRef,
			isLoopRef,
			autoScrollPausedRef,
		],
	);

	const commitDrag = useCallback(
		(endX: number) => {
			const d = drag.current;
			autoScrollPausedRef.current = false;

			if (d.startX === null || !d.dragging) {
				d.startX = null;
				d.dragging = false;
				return;
			}

			const deltaX = endX - d.startX;
			d.startX = null;
			d.dragging = false;
			// A real drag just ended — swallow the trailing click so it does not also
			// activate a link/button that happens to sit under the release point.
			d.suppressClick = true;

			const sw = getComputedSlideWidth();
			const nextIndex = getSnapIndex(
				currentIndexRef.current,
				maxIndexRef.current,
				deltaX,
				sw,
				d.velocityX,
				isLoopRef.current,
			);

			navigateToIndex(nextIndex, 'drag');
		},
		[
			getComputedSlideWidth,
			navigateToIndex,
			currentIndexRef,
			maxIndexRef,
			isLoopRef,
			autoScrollPausedRef,
		],
	);

	const onPointerUp = useCallback(
		(e: PointerEvent<HTMLDivElement>) => commitDrag(e.clientX),
		[commitDrag],
	);

	const onPointerCancel = useCallback(() => {
		const d = drag.current;
		autoScrollPausedRef.current = false;
		d.startX = null;
		d.dragging = false;
		snapToVisual(visualIndexOf(currentIndexRef.current), true);
	}, [snapToVisual, visualIndexOf, currentIndexRef, autoScrollPausedRef]);

	// Capture-phase guard: only the click that immediately follows a real drag is
	// cancelled; ordinary taps fall through untouched.
	const onClickCapture = useCallback((e: MouseEvent<HTMLDivElement>) => {
		if (!drag.current.suppressClick) return;
		drag.current.suppressClick = false;
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
