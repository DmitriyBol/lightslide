import {useCallback, useLayoutEffect, useRef, useState} from 'react';

import type {MutableRefObject, RefObject} from 'react';

type SlideMetrics = {
	slideWidth: number;
	measureSlideWidth: () => void;
	getComputedSlideWidth: () => number;
};

// Measures the container and derives the per-slide px width, floored so the track
// transform stays pixel-aligned with the slides. Re-measures on container resize.
// `slideWidth` is reactive state (drives slide layout via context); the getter reads
// the live DOM for synchronous use inside pointer handlers and snap math.
export function useSlideMetrics(
	containerRef: RefObject<HTMLDivElement>,
	slidesPerViewRef: MutableRefObject<number>,
): SlideMetrics {
	const [slideWidth, setSlideWidth] = useState(0);
	const slideWidthRef = useRef(0);

	const measureSlideWidth = useCallback(() => {
		if (!containerRef.current) return;
		const w = Math.floor(
			containerRef.current.offsetWidth / slidesPerViewRef.current,
		);
		if (w === slideWidthRef.current) return;
		slideWidthRef.current = w;
		setSlideWidth(w);
	}, [containerRef, slidesPerViewRef]);

	const getComputedSlideWidth = useCallback(
		() =>
			containerRef.current
				? Math.floor(
						containerRef.current.offsetWidth / slidesPerViewRef.current,
					)
				: 0,
		[containerRef, slidesPerViewRef],
	);

	useLayoutEffect(() => {
		measureSlideWidth();
		if (!containerRef.current) return;
		const ro = new ResizeObserver(measureSlideWidth);
		ro.observe(containerRef.current);
		return () => ro.disconnect();
	}, [measureSlideWidth, containerRef]);

	return {slideWidth, measureSlideWidth, getComputedSlideWidth};
}
