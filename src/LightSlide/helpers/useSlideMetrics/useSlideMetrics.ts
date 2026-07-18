import {useCallback, useState} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from '../store';
import {useIsomorphicLayoutEffect} from '../useIsomorphicLayoutEffect/useIsomorphicLayoutEffect';

type SlideMetrics = {
	slideWidth: number;
	measureSlideWidth: () => void;
};

/**
 * Measures the viewport along the scroll axis and derives the per-slide px size —
 * (viewportSize − (ceil(slidesPerView) − 1) × gap) / slidesPerView, floored so the track
 * transform stays pixel-aligned with the slides. ceil − 1 is the number of gaps visible
 * alongside the slidesPerView slides: a fractional view (e.g. 1.5) keeps every gap before the
 * partial slide fully on screen. Re-measures on viewport resize. The viewport, not the
 * container, is the measured box: horizontally the two are the same width, but a vertical
 * carousel's container also holds the pagination row — slide heights must be fractions of
 * the clipping viewport, exactly as the SSR critical CSS computes them.
 * `slideWidth` — the main-axis slide size (height when store.vertical) — is reactive state
 * (drives slide layout via context) and is mirrored onto the shared store (store.slideWidth)
 * — the single source of truth every motion/gesture hook reads, so the hot paths size the
 * transform from the cached value (no per-frame offsetWidth read, and the transform can
 * never drift from the slides' rendered size). offsetWidth/offsetHeight is touched only
 * here, on mount and on each ResizeObserver callback.
 * `store.centerInset` — the centring shift (viewport − slide) / 2, 0 unless centered — is
 * measured in the same pass and stays imperative-only: nothing renders from it, the
 * layout-resync snap re-applies it to the transform.
 */
export function useSlideMetrics(
	viewportRef: RefObject<HTMLDivElement>,
	storeRef: MutableRefObject<LightSlideStore>,
	centered: boolean,
): SlideMetrics {
	const [slideWidth, setSlideWidth] = useState(0);

	const measureSlideWidth = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const {slidesPerView, gap, vertical} = storeRef.current;
		const size = vertical ? viewport.offsetHeight : viewport.offsetWidth;
		const visibleGaps = (Math.ceil(slidesPerView) - 1) * gap;
		const w = Math.max(0, Math.floor((size - visibleGaps) / slidesPerView));
		storeRef.current.centerInset = centered ? Math.round((size - w) / 2) : 0;
		if (w === storeRef.current.slideWidth) return;
		storeRef.current.slideWidth = w;
		setSlideWidth(w);
	}, [viewportRef, storeRef, centered]);

	useIsomorphicLayoutEffect(() => {
		measureSlideWidth();
		if (!viewportRef.current) return;
		const ro = new ResizeObserver(measureSlideWidth);
		ro.observe(viewportRef.current);
		return () => ro.disconnect();
	}, [measureSlideWidth, viewportRef]);

	return {slideWidth, measureSlideWidth};
}
