import {useCallback, useRef} from 'react';

import type {SlideData} from './Analytics.types';

/**
 * Tracks the unique slide indices the user has actually seen (marked per navigation and per
 * visibility streak), resolved to `SlideData` on demand for the viewed-slides payload.
 */
export function useViewedSlides<T = unknown>(
	getSlideData: (index: number) => T | undefined,
) {
	const viewed = useRef<Set<number>>(new Set());

	const markViewed = useCallback((index: number) => {
		viewed.current.add(index);
	}, []);

	const getViewedSlides = useCallback(
		(): SlideData<T>[] =>
			Array.from(viewed.current)
				.sort((a, b) => a - b)
				.map(index => ({index, data: getSlideData(index)})),
		[getSlideData],
	);

	return {markViewed, getViewedSlides};
}
