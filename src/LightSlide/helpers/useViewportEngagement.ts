import {useCallback, useEffect, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {
	buildInViewportPayload,
	buildReachedEndPayload,
	buildViewedSlidesPayload,
} from '../../analytics/analytics';
import type {AnalyticsHandlers, SlideData} from '../../types';
import {VIEWPORT_THRESHOLD} from './constants';

type ViewportEngagementParams = {
	containerRef: RefObject<HTMLDivElement>;
	currentIndexRef: MutableRefObject<number>;
	slideCountRef: MutableRefObject<number>;
	viewedTimeoutRef: MutableRefObject<number>;
	handlersRef: MutableRefObject<Required<AnalyticsHandlers>>;
	markViewed: (index: number) => void;
	getViewedSlides: () => SlideData[];
	getSlideData: (index: number) => unknown;
};

// Owns the viewport/terminal-event lifecycle: fires onInViewport once, starts the
// viewed-timeout timer while visible, and enforces that onReachedEnd / onViewedSlides
// are mutually exclusive for the component's lifetime (terminalFiredRef guard).
// Returns fireTerminalIfNeeded so navigateToIndex can fire "reachedEnd".
export function useViewportEngagement({
	containerRef,
	currentIndexRef,
	slideCountRef,
	viewedTimeoutRef,
	handlersRef,
	markViewed,
	getViewedSlides,
	getSlideData,
}: ViewportEngagementParams) {
	const terminalFiredRef = useRef(false);
	const inViewportFiredRef = useRef(false);
	const viewedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const viewedStartRef = useRef<number | null>(null);

	const fireTerminalIfNeeded = useCallback(
		(kind: 'reachedEnd' | 'viewedSlides') => {
			if (terminalFiredRef.current) return;
			terminalFiredRef.current = true;

			if (viewedTimerRef.current !== null) {
				clearTimeout(viewedTimerRef.current);
				viewedTimerRef.current = null;
			}

			if (kind === 'reachedEnd') {
				const allSlides: SlideData[] = Array.from(
					{length: slideCountRef.current},
					(_, i) => ({index: i, data: getSlideData(i)}),
				);
				handlersRef.current.onReachedEnd(buildReachedEndPayload(allSlides));
			} else {
				const elapsed = viewedStartRef.current
					? Math.round((Date.now() - viewedStartRef.current) / 1000)
					: viewedTimeoutRef.current;
				handlersRef.current.onViewedSlides(
					buildViewedSlidesPayload(getViewedSlides(), elapsed),
				);
			}
		},
		[
			getSlideData,
			getViewedSlides,
			slideCountRef,
			viewedTimeoutRef,
			handlersRef,
		],
	);

	useEffect(() => {
		const wrapper = containerRef.current;
		if (!wrapper) return;

		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!inViewportFiredRef.current) {
						inViewportFiredRef.current = true;
						handlersRef.current.onInViewport(buildInViewportPayload());
					}
					if (!terminalFiredRef.current && viewedTimerRef.current === null) {
						viewedStartRef.current = Date.now();
						markViewed(currentIndexRef.current);
						viewedTimerRef.current = setTimeout(() => {
							viewedTimerRef.current = null;
							fireTerminalIfNeeded('viewedSlides');
						}, viewedTimeoutRef.current * 1000);
					}
				} else if (viewedTimerRef.current !== null) {
					clearTimeout(viewedTimerRef.current);
					viewedTimerRef.current = null;
				}
			},
			{threshold: VIEWPORT_THRESHOLD},
		);

		io.observe(wrapper);
		return () => {
			io.disconnect();
			if (viewedTimerRef.current !== null) clearTimeout(viewedTimerRef.current);
		};
	}, [
		markViewed,
		fireTerminalIfNeeded,
		containerRef,
		currentIndexRef,
		viewedTimeoutRef,
		handlersRef,
	]);

	return {fireTerminalIfNeeded};
}
