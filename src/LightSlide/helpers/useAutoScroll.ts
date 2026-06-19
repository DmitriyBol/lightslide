import {useEffect} from 'react';

import type {MutableRefObject} from 'react';

import type {AutoScrollConfig} from '../../types';
import type {NavigateFn} from './navigation';

type AutoScrollRefs = {
	currentIndexRef: MutableRefObject<number>;
	maxIndexRef: MutableRefObject<number>;
	isLoopRef: MutableRefObject<boolean>;
	autoScrollPausedRef: MutableRefObject<boolean>;
	navigateToIndexRef: MutableRefObject<NavigateFn>;
};

// Ticks navigation forward on an interval. Pauses while autoScrollPausedRef is set
// (during drag) and never fires onReachedEnd — navigation goes through source "auto".
// Reaches navigateToIndex through a ref so the effect only restarts on config change.
export function useAutoScroll(
	autoScroll: AutoScrollConfig | undefined,
	refs: AutoScrollRefs,
): void {
	const {
		currentIndexRef,
		maxIndexRef,
		isLoopRef,
		autoScrollPausedRef,
		navigateToIndexRef,
	} = refs;

	useEffect(() => {
		if (!autoScroll?.enabled) return;

		const tick = () => {
			if (autoScrollPausedRef.current) return;
			const from = currentIndexRef.current;
			const maxIdx = maxIndexRef.current;
			const next = isLoopRef.current ? from + 1 : from >= maxIdx ? 0 : from + 1;
			navigateToIndexRef.current(next, 'auto');
		};

		const timer = setInterval(tick, autoScroll.interval);
		return () => clearInterval(timer);
	}, [
		autoScroll?.enabled,
		autoScroll?.interval,
		currentIndexRef,
		maxIndexRef,
		isLoopRef,
		autoScrollPausedRef,
		navigateToIndexRef,
	]);
}
