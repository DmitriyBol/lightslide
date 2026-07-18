import {useCallback, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {prefersReducedMotion} from '../../../utils/reducedMotion/reducedMotion';
import {SNAP_DURATION_MS, SNAP_EASING} from '../constants';
import type {LightSlideStore} from '../store';
import {trackOffset} from '../trackOffset/trackOffset';
import {trackTransform} from '../trackTransform/trackTransform';

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
	/**
	 * Detaches the transition listeners of the snap currently animating (null when none is).
	 * A snap can be interrupted before its transitionend — a drag or a non-animated re-snap
	 * clears `transition`, which fires transitioncancel, not transitionend — so the completion
	 * must be able to fire on either event and a superseding snap must drop the stale one.
	 */
	const pendingDetach = useRef<(() => void) | null>(null);

	const snapToVisual = useCallback(
		(visualIndex: number, animate: boolean, onComplete?: () => void) => {
			const track = trackRef.current;
			if (!track) return;

			/**
			 * A new snap supersedes any still-pending completion: without this an interrupted
			 * loop wrap-dance would keep its {once} listener and later fire its silent re-snap
			 * on an unrelated transitionend, jumping the track off the committed index.
			 */
			pendingDetach.current?.();
			pendingDetach.current = null;

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
				track.style.transform = trackTransform(offset, storeRef.current);
				/**
				 * Settle on whichever fires first: a real transitionend runs onComplete, a
				 * transitioncancel (the snap was interrupted) just detaches, so the completion is
				 * discarded rather than deferred onto a future transition.
				 */
				const finish = (event: TransitionEvent) => {
					track.removeEventListener('transitionend', finish);
					track.removeEventListener('transitioncancel', finish);
					pendingDetach.current = null;
					track.style.transition = '';
					if (event.type === 'transitionend') onComplete?.();
				};
				pendingDetach.current = () => {
					track.removeEventListener('transitionend', finish);
					track.removeEventListener('transitioncancel', finish);
				};
				track.addEventListener('transitionend', finish, {once: true});
				track.addEventListener('transitioncancel', finish, {once: true});
			} else {
				track.style.transition = '';
				track.style.transform = trackTransform(offset, storeRef.current);
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
