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

/**
 * Per-instance engagement lifecycle state, held in ONE ref (mirrors useDragGesture's `drag`
 * and useFlow's `flow`): imperative flags and timer handles that must never trigger a re-render.
 *
 * `terminalFired` guards the mutually-exclusive terminal pair (onReachedEnd / onViewedSlides) —
 * once either fires it is set so the other never does. `inViewportFired` makes onInViewport fire
 * only on first visibility. `viewedTimer` is the pending viewed-timeout timer (null when not
 * counting); `viewedStart` is the wall-clock start of the current visible streak, for the
 * elapsed-seconds payload.
 */
type EngagementState = {
	terminalFired: boolean;
	inViewportFired: boolean;
	viewedTimer: ReturnType<typeof setTimeout> | null;
	viewedStart: number | null;
};

const initialEngagementState = (): EngagementState => ({
	terminalFired: false,
	inViewportFired: false,
	viewedTimer: null,
	viewedStart: null,
});

// Owns the viewport/terminal-event lifecycle: fires onInViewport once, starts the
// viewed-timeout timer while visible, and enforces that onReachedEnd / onViewedSlides
// are mutually exclusive for the component's lifetime (the terminalFired guard).
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
	const engagement = useRef<EngagementState>(initialEngagementState());

	const fireTerminalIfNeeded = useCallback(
		(kind: 'reachedEnd' | 'viewedSlides') => {
			const s = engagement.current;
			if (s.terminalFired) return;
			s.terminalFired = true;

			if (s.viewedTimer !== null) {
				clearTimeout(s.viewedTimer);
				s.viewedTimer = null;
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
					const elapsed = s.viewedStart
						? Math.round((Date.now() - s.viewedStart) / 1000)
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
		// engagement.current is stable for the component's life — capture it once so the
		// cleanup reads the live timer handle without an exhaustive-deps warning.
		const s = engagement.current;

		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!s.inViewportFired) {
						s.inViewportFired = true;
						analyticsRef.current?.onInViewport?.(buildInViewportPayload());
					}
					if (
						viewedTrackingEnabled &&
						!s.terminalFired &&
						s.viewedTimer === null
					) {
						s.viewedStart = Date.now();
						markViewed(storeRef.current.currentIndex);
						s.viewedTimer = setTimeout(() => {
							s.viewedTimer = null;
							fireTerminalIfNeeded('viewedSlides');
						}, storeRef.current.viewedTimeout * 1000);
					}
				} else if (s.viewedTimer !== null) {
					clearTimeout(s.viewedTimer);
					s.viewedTimer = null;
				}
			},
			{threshold: VIEWPORT_THRESHOLD},
		);

		io.observe(wrapper);
		return () => {
			io.disconnect();
			if (s.viewedTimer !== null) clearTimeout(s.viewedTimer);
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
