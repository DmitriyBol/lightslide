import {useEffect} from 'react';

import type {MutableRefObject} from 'react';

import type {NavigateFn} from '../../LightSlide/helpers/navigation';
import type {LightSlideStore} from '../../LightSlide/helpers/store';
import {useLatestRef} from '../../LightSlide/helpers/useLatestRef/useLatestRef';

/**
 * `interval` is the ms between ticks; `pauseOnHover`/`pauseOnFocus` are the resolved
 * booleans gating a tick on the store's hovered/focusWithin flags.
 */
type AutoScrollParams = {
	enabled: boolean;
	interval: number;
	pauseOnHover: boolean;
	pauseOnFocus: boolean;
	storeRef: MutableRefObject<LightSlideStore>;
	goToIndex: NavigateFn;
};

/**
 * Ticks navigation forward on an interval. A tick is skipped while any pause holds: the
 * store's autoScrollPaused (drag in progress), apiPaused (the ref handle's pause()), or —
 * per the pauseOnHover/pauseOnFocus config — hovered/focusWithin from useHoverFocus.
 * Navigation goes through source "auto". Reaches goToIndex through a latest-ref so the
 * interval only restarts on a config change.
 */
export function useAutoScroll({
	enabled,
	interval,
	pauseOnHover,
	pauseOnFocus,
	storeRef,
	goToIndex,
}: AutoScrollParams): void {
	const goToIndexRef = useLatestRef(goToIndex);

	useEffect(() => {
		if (!enabled) return;

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
			const next = !isLoop && currentIndex >= maxIndex ? 0 : currentIndex + 1;
			goToIndexRef.current(next, 'auto');
		};

		const timer = setInterval(tick, interval);
		return () => clearInterval(timer);
	}, [enabled, interval, pauseOnHover, pauseOnFocus, storeRef, goToIndexRef]);
}
