import {useCallback} from 'react';

import type {Dispatch, MutableRefObject, SetStateAction} from 'react';

import type {AnalyticsConfig} from '../../types';
import type {NavigateFn} from './navigation';
import type {LightSlideStore} from './store';

/**
 * Wiring for the navigation path: the imperative core (store + snap), the latest-refs of the
 * callback props, the rendered-index setter, and the engagement callbacks (viewed marking +
 * the reached-end terminal).
 */
type NavigationParams<T> = {
	storeRef: MutableRefObject<LightSlideStore<T>>;
	analyticsRef: MutableRefObject<AnalyticsConfig<T> | undefined>;
	onIndexChangeRef: MutableRefObject<((index: number) => void) | undefined>;
	setCurrentIndex: Dispatch<SetStateAction<number>>;
	markViewed: (index: number) => void;
	fireTerminalIfNeeded: (kind: 'reachedEnd' | 'viewedSlides') => void;
	snapToVisual: (
		visualIndex: number,
		animate: boolean,
		onComplete?: () => void,
	) => void;
};

/**
 * The single navigation path shared by every trigger — drag, buttons, dots, auto-scroll, and
 * the external API. `source` decides which extra analytics events fire and whether a no-op
 * drag snaps back. Loop wrap-around is detected from the raw index and resolved as an
 * animated snap onto the edge clone followed by a silent re-snap to the matching real slide.
 */
export function useNavigation<T>({
	storeRef,
	analyticsRef,
	onIndexChangeRef,
	setCurrentIndex,
	markViewed,
	fireTerminalIfNeeded,
	snapToVisual,
}: NavigationParams<T>): NavigateFn {
	return useCallback(
		(nextIndex, source) => {
			const {
				maxIndex: maxIdx,
				isLoop: loopMode,
				loopOffset: offset,
				slideCount: count,
				currentIndex: from,
			} = storeRef.current;

			const isBackwardWrap = loopMode && nextIndex < 0;
			const isForwardWrap = loopMode && nextIndex > maxIdx;

			let clamped: number;
			if (isBackwardWrap) clamped = maxIdx;
			else if (isForwardWrap) clamped = 0;
			else clamped = Math.max(0, Math.min(maxIdx, nextIndex));

			if (clamped === from && !isBackwardWrap && !isForwardWrap) {
				if (source === 'drag')
					snapToVisual(from + (loopMode ? offset : 0), true);
				return;
			}

			const direction: 'left' | 'right' =
				isForwardWrap || clamped > from ? 'right' : 'left';

			storeRef.current.currentIndex = clamped;
			setCurrentIndex(clamped);
			onIndexChangeRef.current?.(clamped);
			markViewed(clamped);

			analyticsRef.current?.onEvent?.({
				event: 'carousel_slide',
				direction,
				fromIndex: from,
				toIndex: clamped,
			});

			if (source === 'button') {
				analyticsRef.current?.onEvent?.({
					event: 'carousel_nav_button',
					direction,
					fromIndex: from,
					toIndex: clamped,
				});
			}
			if (source === 'pagination') {
				analyticsRef.current?.onEvent?.({
					event: 'carousel_pagination_click',
					fromIndex: from,
					toIndex: clamped,
				});
			}

			const isLoopWrap = isBackwardWrap || isForwardWrap;
			if (source !== 'auto' && !isLoopWrap && clamped === maxIdx) {
				fireTerminalIfNeeded('reachedEnd');
			}

			if (isBackwardWrap) {
				snapToVisual(0, true, () => snapToVisual(maxIdx + offset, false));
			} else if (isForwardWrap) {
				snapToVisual(count + offset, true, () => snapToVisual(offset, false));
			} else {
				snapToVisual(clamped + (loopMode ? offset : 0), true);
			}
		},
		[
			storeRef,
			analyticsRef,
			onIndexChangeRef,
			setCurrentIndex,
			markViewed,
			fireTerminalIfNeeded,
			snapToVisual,
		],
	);
}
