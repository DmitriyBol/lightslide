import {useCallback} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {SNAP_DURATION_MS, SNAP_EASING} from './constants';

type TrackSnap = {
	snapToVisual: (
		visualIndex: number,
		animate: boolean,
		onComplete?: () => void,
	) => void;
	snapTrack: (logicalIndex: number, animate: boolean) => void;
};

// Imperatively moves the track via transform: translateX.
// `snapToVisual` works in absolute visual indices (visual = logical + loopOffset in loop mode);
// `snapTrack` is the logical-index convenience wrapper. onComplete fires after the transition
// ends, or immediately when animate is false.
export function useTrackSnap(
	trackRef: RefObject<HTMLDivElement>,
	getComputedSlideWidth: () => number,
	isLoopRef: MutableRefObject<boolean>,
	loopOffsetRef: MutableRefObject<number>,
): TrackSnap {
	const snapToVisual = useCallback(
		(visualIndex: number, animate: boolean, onComplete?: () => void) => {
			const track = trackRef.current;
			if (!track) return;
			const sw = getComputedSlideWidth();

			if (animate) {
				track.style.transition = `transform ${SNAP_DURATION_MS}ms ${SNAP_EASING}`;
				track.style.transform = `translateX(${-visualIndex * sw}px)`;
				const onEnd = () => {
					track.style.transition = '';
					track.removeEventListener('transitionend', onEnd);
					onComplete?.();
				};
				track.addEventListener('transitionend', onEnd, {once: true});
			} else {
				track.style.transition = '';
				track.style.transform = `translateX(${-visualIndex * sw}px)`;
				onComplete?.();
			}
		},
		[trackRef, getComputedSlideWidth],
	);

	const snapTrack = useCallback(
		(logicalIndex: number, animate: boolean) => {
			const visualIndex = isLoopRef.current
				? logicalIndex + loopOffsetRef.current
				: logicalIndex;
			snapToVisual(visualIndex, animate);
		},
		[snapToVisual, isLoopRef, loopOffsetRef],
	);

	return {snapToVisual, snapTrack};
}
