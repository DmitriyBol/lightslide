import {useCallback} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {prefersReducedMotion} from '../../utils/reducedMotion';
import {SNAP_DURATION_MS, SNAP_EASING} from './constants';
import type {LightSlideStore} from './store';
import {trackOffset} from './trackOffset';

type TrackSnap = {
	snapToVisual: (
		visualIndex: number,
		animate: boolean,
		onComplete?: () => void,
	) => void;
	snapTrack: (logicalIndex: number, animate: boolean) => void;
};

/**
 * Imperatively moves the track via transform: translateX.
 * `snapToVisual` works in absolute visual indices (visual = logical + loopOffset in loop mode);
 * `snapTrack` is the logical-index convenience wrapper. onComplete fires after the transition
 * ends, or immediately when animate is false. The offset comes from trackOffset (cached
 * store.slideWidth), so the snap lands on a slide boundary — and on the flush right edge for the
 * last index when slidesPerView is fractional.
 */
export function useTrackSnap(
	trackRef: RefObject<HTMLDivElement>,
	storeRef: MutableRefObject<LightSlideStore>,
): TrackSnap {
	const snapToVisual = useCallback(
		(visualIndex: number, animate: boolean, onComplete?: () => void) => {
			const track = trackRef.current;
			if (!track) return;
			const offset = trackOffset(visualIndex, storeRef.current);
			/** Every snap defines a new rest position — free-mode drags start from it. */
			storeRef.current.restOffset = offset;

			/**
			 * Honour prefers-reduced-motion by snapping instantly. Crucially we route through the
			 * no-transition branch (not just transition: none) so onComplete still fires — the loop
			 * wrap-around depends on it, and a forced CSS transition:none would never emit
			 * transitionend, stalling the re-snap.
			 */
			const doAnimate = animate && !prefersReducedMotion();

			if (doAnimate) {
				track.style.transition = `transform ${SNAP_DURATION_MS}ms ${SNAP_EASING}`;
				track.style.transform = `translateX(${-offset}px)`;
				const onEnd = () => {
					track.style.transition = '';
					track.removeEventListener('transitionend', onEnd);
					onComplete?.();
				};
				track.addEventListener('transitionend', onEnd, {once: true});
			} else {
				track.style.transition = '';
				track.style.transform = `translateX(${-offset}px)`;
				onComplete?.();
			}
		},
		[trackRef, storeRef],
	);

	const snapTrack = useCallback(
		(logicalIndex: number, animate: boolean) => {
			const {isLoop, loopOffset} = storeRef.current;
			const visualIndex = isLoop ? logicalIndex + loopOffset : logicalIndex;
			snapToVisual(visualIndex, animate);
		},
		[snapToVisual, storeRef],
	);

	return {snapToVisual, snapTrack};
}
