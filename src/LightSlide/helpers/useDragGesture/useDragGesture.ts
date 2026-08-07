import {useCallback} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {getSnapIndex, VELOCITY_THRESHOLD} from '../../../utils/swipe/swipe';
import {RUBBER_BAND_DIVISOR} from '../constants';
import type {NavigateFn} from '../navigation';
import {nearestVisualIndex} from '../slideOffsets/slideOffsets';
import type {LightSlideStore} from '../store';
import {trackOffset} from '../trackOffset/trackOffset';
import {trackTransform} from '../trackTransform/trackTransform';
import type {PointerHandlers} from '../usePointerGesture/usePointerGesture';
import {usePointerGesture} from '../usePointerGesture/usePointerGesture';

type DragGestureParams = {
	trackRef: RefObject<HTMLDivElement | null>;
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
	const onStart = useCallback(() => {
		storeRef.current.autoScrollPaused = true;
		/** Clear any leftover snap transition so the drag tracks the finger 1:1. */
		if (trackRef.current) trackRef.current.style.transition = '';
	}, [storeRef, trackRef]);

	const onMove = useCallback(
		(dx: number) => {
			const {isLoop, currentIndex, maxIndex, loopOffset} = storeRef.current;
			/** Rubber-band resistance when dragging past the first/last slide (non-loop only). */
			const atStart = !isLoop && currentIndex <= 0 && dx > 0;
			const atEnd = !isLoop && currentIndex >= maxIndex && dx < 0;
			const delta = atStart || atEnd ? dx / RUBBER_BAND_DIVISOR : dx;
			if (trackRef.current) {
				/**
				 * Same clamped base offset the resting snap uses (loopOffset is 0 when not
				 * looping), so a fractional slidesPerView never jumps half a slide when the
				 * gesture starts.
				 */
				const base = trackOffset(currentIndex + loopOffset, storeRef.current);
				trackRef.current.style.transform = trackTransform(
					base - delta,
					storeRef.current,
				);
			}
		},
		[storeRef, trackRef],
	);

	const onEnd = useCallback(
		(dx: number, velocityX: number, moved: boolean) => {
			storeRef.current.autoScrollPaused = false;
			/** moved === false is a tap / vertical abandon — nothing to snap. */
			if (!moved) return;
			const store = storeRef.current;
			const {currentIndex, maxIndex, isLoop, slideWidth, gap, slideOffsets} =
				store;

			if (slideOffsets) {
				const {loopOffset, centerInset} = store;
				const currentVisual = currentIndex + loopOffset;
				/**
				 * Position-based snap: the drag left the track resting near
				 * `trackOffset(currentVisual) − dx`; land on the boundary nearest that offset. A
				 * fast flick that hasn't crossed the half-way point still advances one slide in
				 * its direction (rightward flick → earlier), matching the fixed-mode threshold.
				 */
				const pos = trackOffset(currentVisual, store) - dx + centerInset;
				let visual = nearestVisualIndex(slideOffsets, pos);
				if (visual === currentVisual && Math.abs(velocityX) > VELOCITY_THRESHOLD)
					visual = currentVisual + (velocityX < 0 ? 1 : -1);
				goToIndex(visual - loopOffset, 'drag');
				return;
			}

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
		const {currentIndex, loopOffset} = storeRef.current;
		storeRef.current.autoScrollPaused = false;
		/** Abort: return the track to the current slide's resting position. */
		snapToVisual(currentIndex + loopOffset, true);
	}, [storeRef, snapToVisual]);

	return usePointerGesture({trackRef, storeRef, onStart, onMove, onEnd, onCancel});
}
