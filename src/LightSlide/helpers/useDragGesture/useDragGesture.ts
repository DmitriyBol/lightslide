import {useCallback} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {getSnapIndex} from '../../../utils/swipe/swipe';
import {RUBBER_BAND_DIVISOR} from '../constants';
import type {NavigateFn} from '../navigation';
import type {LightSlideStore} from '../store';
import {trackOffset} from '../trackOffset/trackOffset';
import type {PointerHandlers} from '../usePointerGesture/usePointerGesture';
import {usePointerGesture} from '../usePointerGesture/usePointerGesture';

type DragGestureParams = {
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	snapToVisual: (
		visualIndex: number,
		animate: boolean,
		onComplete?: () => void,
	) => void;
	goToIndex: NavigateFn;
};

/**
 * Discrete drag-to-snap. The shared pointer mechanics (direction lock, deferred capture, velocity,
 * click suppression, leave safety) live in usePointerGesture; this hook supplies only the snap
 * behaviour: rubber-band the track during the drag, commit a snap index through goToIndex on
 * release, and re-settle to the current slide on cancel. Returns the same handler bag as useFlow
 * and useFreeDrag, so LightSlide swaps them by reference without caring which is active.
 */
export function useDragGesture({
	trackRef,
	storeRef,
	snapToVisual,
	goToIndex,
}: DragGestureParams): PointerHandlers {
	const visualIndexOf = useCallback(
		(logicalIndex: number) => {
			const {isLoop, loopOffset} = storeRef.current;
			return isLoop ? logicalIndex + loopOffset : logicalIndex;
		},
		[storeRef],
	);

	const onStart = useCallback(() => {
		storeRef.current.autoScrollPaused = true;
		/** Clear any leftover snap transition so the drag tracks the finger 1:1. */
		if (trackRef.current) trackRef.current.style.transition = '';
	}, [storeRef, trackRef]);

	const onMove = useCallback(
		(dx: number) => {
			const {isLoop, currentIndex, maxIndex} = storeRef.current;
			/** Rubber-band resistance when dragging past the first/last slide (non-loop only). */
			const atStart = !isLoop && currentIndex <= 0 && dx > 0;
			const atEnd = !isLoop && currentIndex >= maxIndex && dx < 0;
			const delta = atStart || atEnd ? dx / RUBBER_BAND_DIVISOR : dx;
			if (trackRef.current) {
				/**
				 * Same clamped base offset the resting snap uses, so a fractional slidesPerView
				 * never jumps half a slide when the gesture starts.
				 */
				const base = trackOffset(visualIndexOf(currentIndex), storeRef.current);
				trackRef.current.style.transform = `translateX(${-base + delta}px)`;
			}
		},
		[storeRef, trackRef, visualIndexOf],
	);

	const onEnd = useCallback(
		(dx: number, velocityX: number, moved: boolean) => {
			storeRef.current.autoScrollPaused = false;
			/** moved === false is a tap / vertical abandon — nothing to snap. */
			if (!moved) return;
			const {currentIndex, maxIndex, isLoop, slideWidth, gap} =
				storeRef.current;
			const nextIndex = getSnapIndex(
				currentIndex,
				maxIndex,
				dx,
				slideWidth + gap,
				velocityX,
				isLoop,
			);
			goToIndex(nextIndex, 'drag');
		},
		[storeRef, goToIndex],
	);

	const onCancel = useCallback(() => {
		storeRef.current.autoScrollPaused = false;
		/** Abort: return the track to the current slide's resting position. */
		snapToVisual(visualIndexOf(storeRef.current.currentIndex), true);
	}, [storeRef, snapToVisual, visualIndexOf]);

	return usePointerGesture({trackRef, onStart, onMove, onEnd, onCancel});
}
