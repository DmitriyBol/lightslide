import {useCallback, useLayoutEffect, useState} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from './store';

type SlideMetrics = {
	slideWidth: number;
	measureSlideWidth: () => void;
};

// Measures the container and derives the per-slide px width, floored so the track
// transform stays pixel-aligned with the slides. Re-measures on container resize.
// `slideWidth` is reactive state (drives slide layout via context) and is mirrored onto
// the shared store (store.slideWidth) — the single source of truth every motion/gesture
// hook reads, so the hot paths size the transform from the cached value (no per-frame
// offsetWidth read, and the transform can never drift from the slides' rendered width).
// offsetWidth is touched only here, on mount and on each ResizeObserver callback.
export function useSlideMetrics(
	containerRef: RefObject<HTMLDivElement>,
	storeRef: MutableRefObject<LightSlideStore>,
): SlideMetrics {
	const [slideWidth, setSlideWidth] = useState(0);

	const measureSlideWidth = useCallback(() => {
		if (!containerRef.current) return;
		const w = Math.floor(
			containerRef.current.offsetWidth / storeRef.current.slidesPerView,
		);
		if (w === storeRef.current.slideWidth) return;
		storeRef.current.slideWidth = w;
		setSlideWidth(w);
	}, [containerRef, storeRef]);

	useLayoutEffect(() => {
		measureSlideWidth();
		if (!containerRef.current) return;
		const ro = new ResizeObserver(measureSlideWidth);
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, [measureSlideWidth, containerRef]);

	return {slideWidth, measureSlideWidth};
}
