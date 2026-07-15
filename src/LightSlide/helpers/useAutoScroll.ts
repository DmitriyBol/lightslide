import {useEffect} from 'react';

import type {MutableRefObject} from 'react';

import type {AutoScrollConfig} from '../../types';
import type {NavigateFn} from './navigation';
import type {LightSlideStore} from './store';

type AutoScrollRefs = {
	storeRef: MutableRefObject<LightSlideStore>;
	navigateToIndexRef: MutableRefObject<NavigateFn>;
};

/**
 * Ticks navigation forward on an interval. Pauses while the store's autoScrollPaused flag
 * is set (during drag) and never fires onReachedEnd — navigation goes through source "auto".
 * Reaches navigateToIndex through a ref so the effect only restarts on config change.
 */
export function useAutoScroll(
	autoScroll: AutoScrollConfig | undefined,
	refs: AutoScrollRefs,
): void {
	const {storeRef, navigateToIndexRef} = refs;

	useEffect(() => {
		if (!autoScroll?.enabled) return;

		const tick = () => {
			const {autoScrollPaused, currentIndex, maxIndex, isLoop} =
				storeRef.current;
			if (autoScrollPaused) return;
			const next = isLoop
				? currentIndex + 1
				: currentIndex >= maxIndex
					? 0
					: currentIndex + 1;
			navigateToIndexRef.current(next, 'auto');
		};

		const timer = setInterval(tick, autoScroll.interval);
		return () => clearInterval(timer);
	}, [autoScroll?.enabled, autoScroll?.interval, storeRef, navigateToIndexRef]);
}
