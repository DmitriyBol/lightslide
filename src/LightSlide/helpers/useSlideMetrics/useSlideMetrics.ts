import {useCallback, useState} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {buildSlideOffsets, measuredMaxIndex} from '../buildOffsets/buildOffsets';
import type {LightSlideStore} from '../store';
import {useIsomorphicLayoutEffect} from '../useIsomorphicLayoutEffect/useIsomorphicLayoutEffect';

type SlideMetrics = {
	slideWidth: number;
	autoMaxIndex: number;
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
 * In variable-width mode (`auto`) there is no single slide size: the hook measures the
 * main-axis size of every rendered track child (real slides and loop clones alike) and writes
 * the cumulative `store.slideOffsets` array that trackOffset indexes; the ResizeObserver also
 * watches the track so slide-content resizes (images loading) re-measure. `slideWidth` stays 0
 * so the slide applies no inline size and keeps its content width.
 * `store.centerInset` — the centring shift (viewport − slide) / 2, 0 unless centered — is
 * measured in the same pass and stays imperative-only: nothing renders from it, the
 * layout-resync snap re-applies it to the transform.
 */
export function useSlideMetrics(
	viewportRef: RefObject<HTMLDivElement>,
	trackRef: RefObject<HTMLDivElement>,
	storeRef: MutableRefObject<LightSlideStore>,
	centered: boolean,
	auto: boolean,
): SlideMetrics {
	const [slideWidth, setSlideWidth] = useState(0);
	/**
	 * Variable-width mode's reachable-position count, measured rather than derived from
	 * slidesPerView. -1 until the first measure, so the carousel can tell "not measured yet"
	 * from a genuine single-position strip.
	 */
	const [autoMaxIndex, setAutoMaxIndex] = useState(-1);

	const measureSlideWidth = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const {slidesPerView, gap, vertical} = storeRef.current;
		const size = vertical ? viewport.offsetHeight : viewport.offsetWidth;
		storeRef.current.viewportSize = size;

		if (auto) {
			const track = trackRef.current;
			if (!track) return;
			const sizes = Array.from(track.children, child =>
				vertical
					? (child as HTMLElement).offsetHeight
					: (child as HTMLElement).offsetWidth,
			);
			const offsets = buildSlideOffsets(sizes, gap);
			storeRef.current.slideOffsets = offsets;
			storeRef.current.centerInset = 0;
			/**
			 * Clone edges are part of the strip but never scroll targets, so the reachable count
			 * is measured over the real slides only (loopOffset per side).
			 */
			const {loopOffset, isLoop} = storeRef.current;
			const real = isLoop
				? offsets.slice(loopOffset, offsets.length - loopOffset)
				: offsets;
			const measured = measuredMaxIndex(real, gap, size);
			/**
			 * Written imperatively as well as into state: the layout-resync effect runs before
			 * React processes the state update and must clamp against the fresh count.
			 */
			storeRef.current.maxIndex = measured;
			setAutoMaxIndex(measured);
			return;
		}

		const visibleGaps = (Math.ceil(slidesPerView) - 1) * gap;
		const w = Math.max(0, Math.floor((size - visibleGaps) / slidesPerView));
		storeRef.current.centerInset = centered ? Math.round((size - w) / 2) : 0;
		if (w === storeRef.current.slideWidth) return;
		storeRef.current.slideWidth = w;
		setSlideWidth(w);
	}, [viewportRef, trackRef, storeRef, centered, auto]);

	useIsomorphicLayoutEffect(() => {
		measureSlideWidth();
		const viewport = viewportRef.current;
		if (!viewport) return;
		const ro = new ResizeObserver(measureSlideWidth);
		ro.observe(viewport);
		const track = trackRef.current;
		if (auto && track) ro.observe(track);
		return () => ro.disconnect();
	}, [measureSlideWidth, viewportRef, trackRef, auto]);

	return {slideWidth, autoMaxIndex, measureSlideWidth};
}
