import {useCallback, useState} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from './store';
import {useIsomorphicLayoutEffect} from './useIsomorphicLayoutEffect';

type SlideMetrics = {
	slideWidth: number;
	measureSlideWidth: () => void;
};

/**
 * Measures the container and derives the per-slide px width —
 * (containerWidth − (ceil(slidesPerView) − 1) × gap) / slidesPerView, floored so the track
 * transform stays pixel-aligned with the slides. ceil − 1 is the number of gaps visible
 * alongside the slidesPerView slides: a fractional view (e.g. 1.5) keeps every gap before the
 * partial slide fully on screen. Re-measures on container resize.
 * `slideWidth` is reactive state (drives slide layout via context) and is mirrored onto
 * the shared store (store.slideWidth) — the single source of truth every motion/gesture
 * hook reads, so the hot paths size the transform from the cached value (no per-frame
 * offsetWidth read, and the transform can never drift from the slides' rendered width).
 * offsetWidth is touched only here, on mount and on each ResizeObserver callback.
 * `store.centerInset` — the centring shift (container − slide) / 2, 0 unless centered — is
 * measured in the same pass and stays imperative-only: nothing renders from it, the
 * layout-resync snap re-applies it to the transform.
 */
export function useSlideMetrics(
	containerRef: RefObject<HTMLDivElement>,
	storeRef: MutableRefObject<LightSlideStore>,
	centered: boolean,
): SlideMetrics {
	const [slideWidth, setSlideWidth] = useState(0);

	const measureSlideWidth = useCallback(() => {
		if (!containerRef.current) return;
		const {slidesPerView, gap} = storeRef.current;
		const {offsetWidth} = containerRef.current;
		const visibleGaps = (Math.ceil(slidesPerView) - 1) * gap;
		const w = Math.max(
			0,
			Math.floor((offsetWidth - visibleGaps) / slidesPerView),
		);
		storeRef.current.centerInset = centered
			? Math.round((offsetWidth - w) / 2)
			: 0;
		if (w === storeRef.current.slideWidth) return;
		storeRef.current.slideWidth = w;
		setSlideWidth(w);
	}, [containerRef, storeRef, centered]);

	useIsomorphicLayoutEffect(() => {
		measureSlideWidth();
		if (!containerRef.current) return;
		const ro = new ResizeObserver(measureSlideWidth);
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, [measureSlideWidth, containerRef]);

	return {slideWidth, measureSlideWidth};
}
