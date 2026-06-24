import {useCallback, useEffect, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {
	buildInViewportPayload,
	buildReachedEndPayload,
	buildViewedSlidesPayload,
} from '../../analytics/analytics';
import type {AnalyticsHandlers, SlideData} from '../../types';
import {VIEWPORT_THRESHOLD} from './constants';
import type {LightSlideStore} from './store';

type ViewportEngagementParams<T> = {
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore<T>>;
	// Latest-ref of the raw analytics prop; handlers are called optionally at fire time.
	analyticsRef: MutableRefObject<AnalyticsHandlers<T> | undefined>;
	// Whether the consumer actually wants viewed-slides tracking. When false the
	// viewed-timeout timer is never started (the feature is opt-in via onViewedSlides).
	viewedTrackingEnabled: boolean;
	markViewed: (index: number) => void;
	getViewedSlides: () => SlideData<T>[];
	getSlideData: (index: number) => T | undefined;
};

// Owns the viewport/terminal-event lifecycle: fires onInViewport once, starts the
// viewed-timeout timer while visible, and enforces that onReachedEnd / onViewedSlides
// are mutually exclusive for the component's lifetime (terminalFiredRef guard).
// Returns fireTerminalIfNeeded so navigateToIndex can fire "reachedEnd".
export function useViewportEngagement<T>({
	containerRef,
	storeRef,
	analyticsRef,
	viewedTrackingEnabled,
	markViewed,
	getViewedSlides,
	getSlideData,
}: ViewportEngagementParams<T>) {
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
				const onReachedEnd = analyticsRef.current?.onReachedEnd;
				if (onReachedEnd) {
					const allSlides: SlideData<T>[] = Array.from(
						{length: storeRef.current.slideCount},
						(_, i) => ({index: i, data: getSlideData(i)}),
					);
					onReachedEnd(buildReachedEndPayload(allSlides));
				}
			} else {
				const onViewedSlides = analyticsRef.current?.onViewedSlides;
				if (onViewedSlides) {
					const elapsed = viewedStartRef.current
						? Math.round((Date.now() - viewedStartRef.current) / 1000)
						: storeRef.current.viewedTimeout;
					onViewedSlides(buildViewedSlidesPayload(getViewedSlides(), elapsed));
				}
			}
		},
		[getSlideData, getViewedSlides, storeRef, analyticsRef],
	);

	useEffect(() => {
		const wrapper = containerRef.current;
		if (!wrapper) return;

		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!inViewportFiredRef.current) {
						inViewportFiredRef.current = true;
						analyticsRef.current?.onInViewport?.(buildInViewportPayload());
					}
					if (
						viewedTrackingEnabled &&
						!terminalFiredRef.current &&
						viewedTimerRef.current === null
					) {
						viewedStartRef.current = Date.now();
						markViewed(storeRef.current.currentIndex);
						viewedTimerRef.current = setTimeout(() => {
							viewedTimerRef.current = null;
							fireTerminalIfNeeded('viewedSlides');
						}, storeRef.current.viewedTimeout * 1000);
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
		storeRef,
		analyticsRef,
		viewedTrackingEnabled,
	]);

	return {fireTerminalIfNeeded};
}
