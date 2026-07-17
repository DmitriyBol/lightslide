import {useCallback} from 'react';

import type {Dispatch, MutableRefObject, SetStateAction} from 'react';

import type {AnalyticsConfig} from '../../types';
import type {NavigateFn} from './navigation';
import type {LightSlideStore} from './store';
import {trackOffset} from './trackOffset';

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
 *
 * 'settle' (a free-drag coast coming to rest) is the one source that never moves the track:
 * the index commits with plain clamping (no wrap dance — the coast already wrapped its
 * offset) and every snap is skipped. Conversely, when any user trigger targets the current
 * index while the track rests OFF its boundary (a free-mode rest), the early return still
 * re-aligns the track — clicking the active dot after a free scroll straightens the slides.
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

			const wraps = loopMode && source !== 'settle';
			const isBackwardWrap = wraps && nextIndex < 0;
			const isForwardWrap = wraps && nextIndex > maxIdx;

			let clamped: number;
			if (isBackwardWrap) clamped = maxIdx;
			else if (isForwardWrap) clamped = 0;
			else clamped = Math.max(0, Math.min(maxIdx, nextIndex));

			if (clamped === from && !isBackwardWrap && !isForwardWrap) {
				const fromVisual = from + (loopMode ? offset : 0);
				const offBoundary =
					storeRef.current.restOffset !==
					trackOffset(fromVisual, storeRef.current);
				if (source === 'drag' || (source !== 'settle' && offBoundary))
					snapToVisual(fromVisual, true);
				return;
			}

			/**
			 * A wrap's direction is the user's motion, not the index delta — a backward wrap
			 * jumps 0 → maxIdx yet the track visibly moves left.
			 */
			const direction: 'left' | 'right' =
				isForwardWrap || (!isBackwardWrap && clamped > from)
					? 'right'
					: 'left';

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
				/**
				 * The animated target is maxIdx's pre-wrap twin one content-width to the left —
				 * maxIdx + offset − slideCount, NOT a hardcoded 0: with a fractional slidesPerView
				 * (or center's extra clones) the twin sits above visual 0, and landing short of it
				 * would jump at the silent re-snap.
				 */
				snapToVisual(maxIdx + offset - count, true, () =>
					snapToVisual(maxIdx + offset, false),
				);
			} else if (isForwardWrap) {
				snapToVisual(count + offset, true, () => snapToVisual(offset, false));
			} else if (source !== 'settle') {
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
