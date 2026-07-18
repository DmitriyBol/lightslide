import {useCallback} from 'react';

import type {Dispatch, MutableRefObject, SetStateAction} from 'react';

import type {NavDirection, NavigateFn} from '../navigation';
import type {LightSlideStore} from '../store';
import {trackOffset} from '../trackOffset/trackOffset';

/**
 * Wiring for the navigation path: the imperative core (store + snap), the latest-ref of the
 * onIndexChange prop, and the rendered-index setter.
 */
type NavigationParams = {
	storeRef: MutableRefObject<LightSlideStore>;
	onIndexChangeRef: MutableRefObject<((index: number) => void) | undefined>;
	setCurrentIndex: Dispatch<SetStateAction<number>>;
	snapToVisual: (
		visualIndex: number,
		animate: boolean,
		onComplete?: () => void,
	) => void;
};

/**
 * The single navigation path shared by every trigger — drag, buttons, dots, autoplay, and
 * the external API. `source` decides whether a no-op drag snaps back; analytics stays out of
 * the core — every committed change is reported through the store's optional `emitNav`
 * mailbox (assigned by the `lightslide/analytics` plugin) with flat arguments. Loop
 * wrap-around is detected from the raw index and resolved as an animated snap onto the edge
 * clone followed by a silent re-snap to the matching real slide.
 *
 * 'settle' (a free-drag coast coming to rest) is the one source that never moves the track:
 * the index commits with plain clamping (no wrap dance — the coast already wrapped its
 * offset) and every snap is skipped. Conversely, when any user trigger targets the current
 * index while the track rests OFF its boundary (a free-mode rest), the early return still
 * re-aligns the track — clicking the active dot after a free scroll straightens the slides.
 */
export function useNavigation({
	storeRef,
	onIndexChangeRef,
	setCurrentIndex,
	snapToVisual,
}: NavigationParams): NavigateFn {
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
			 * jumps 0 → maxIdx yet the track visibly moves left. The direction is the VISUAL
			 * truth, so under rtl a forward step reports 'left' (analytics resolves the wrap
			 * contradiction through the same dirSign), and a vertical carousel reports
			 * 'down' / 'up' (no mirroring — vertical order has no reading direction). A free
			 * coast wraps its offset without the wrap dance, so for 'settle' the visual
			 * direction comes from the recorded coast sign, not the (inverted-on-wrap) delta.
			 */
			const isForward =
				isForwardWrap ||
				(source === 'settle'
					? storeRef.current.settleForward
					: !isBackwardWrap && clamped > from);
			const {dirSign, vertical} = storeRef.current;
			let direction: NavDirection;
			if (vertical) direction = isForward ? 'down' : 'up';
			else direction = isForward === (dirSign === 1) ? 'right' : 'left';

			storeRef.current.currentIndex = clamped;
			setCurrentIndex(clamped);
			onIndexChangeRef.current?.(clamped);
			storeRef.current.emitNav?.(from, clamped, direction, source);

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
		[storeRef, onIndexChangeRef, setCurrentIndex, snapToVisual],
	);
}
