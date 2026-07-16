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
 * Ticks navigation forward on an interval. A tick is skipped while any pause holds: the
 * store's autoScrollPaused (drag in progress), apiPaused (the ref handle's pause()), or —
 * per the pauseOnHover/pauseOnFocus config, both default true — hovered/focusWithin from
 * useHoverFocus. Never fires onReachedEnd — navigation goes through source "auto". Reaches
 * navigateToIndex through a ref so the effect only restarts on config change.
 */
export function useAutoScroll(
	autoScroll: AutoScrollConfig | undefined,
	refs: AutoScrollRefs,
): void {
	const {storeRef, navigateToIndexRef} = refs;

	useEffect(() => {
		if (!autoScroll?.enabled) return;
		const pauseOnHover = autoScroll.pauseOnHover !== false;
		const pauseOnFocus = autoScroll.pauseOnFocus !== false;

		const tick = () => {
			const {
				autoScrollPaused,
				apiPaused,
				hovered,
				focusWithin,
				currentIndex,
				maxIndex,
				isLoop,
			} = storeRef.current;
			if (autoScrollPaused || apiPaused) return;
			if ((pauseOnHover && hovered) || (pauseOnFocus && focusWithin)) return;
			const next = isLoop
				? currentIndex + 1
				: currentIndex >= maxIndex
					? 0
					: currentIndex + 1;
			navigateToIndexRef.current(next, 'auto');
		};

		const timer = setInterval(tick, autoScroll.interval);
		return () => clearInterval(timer);
	}, [
		autoScroll?.enabled,
		autoScroll?.interval,
		autoScroll?.pauseOnHover,
		autoScroll?.pauseOnFocus,
		storeRef,
		navigateToIndexRef,
	]);
}
