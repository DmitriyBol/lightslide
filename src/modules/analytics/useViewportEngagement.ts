import {useCallback, useEffect, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from '../../LightSlide/helpers/store';
import type {AnalyticsEvent, SlideData} from './Analytics.types';

/**
 * Default seconds of ≥50% viewport visibility before carousel_viewed_slides fires.
 * Module-local, not in helpers/constants.ts — the constants chunk is shared by every entry
 * and analytics-only tuning must not cost bundles that never import `lightslide/analytics`.
 */
export const DEFAULT_VIEWED_TIMEOUT = 30;

/** Fraction of the carousel that must be visible to count as "in viewport". */
const VIEWPORT_THRESHOLD = 0.5;

/**
 * `viewedTimeout` is the raw prop: its presence opts into viewed-slides tracking, its value
 * the seconds of visibility before the viewed terminal fires. `onEventRef` is the latest-ref
 * of the onEvent prop, read at fire time.
 */
type ViewportEngagementParams<T> = {
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	onEventRef: MutableRefObject<(payload: AnalyticsEvent<T>) => void>;
	viewedTimeout: number | undefined;
	markViewed: (index: number) => void;
	getViewedSlides: () => SlideData<T>[];
	getSlideData: (index: number) => T | undefined;
};

/**
 * Per-instance engagement lifecycle state, held in ONE ref (mirrors useDragGesture's `drag`
 * and useFlow's `flow`): imperative flags and timer handles that must never trigger a re-render.
 *
 * `terminalFired` guards the mutually-exclusive terminal pair (carousel_reached_end /
 * carousel_viewed_slides) — once either fires it is set so the other never does. `inViewportFired`
 * makes carousel_in_viewport fire only on first visibility. `viewedTimer` is the pending
 * viewed-timeout timer (null when not
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

/**
 * Owns the viewport/terminal-event lifecycle: fires carousel_in_viewport once, starts the
 * viewed-timeout timer while visible, and enforces that carousel_reached_end /
 * carousel_viewed_slides are mutually exclusive for the component's lifetime (the terminalFired
 * guard). Returns fireTerminalIfNeeded so the emitNav handler can fire "reachedEnd".
 */
export function useViewportEngagement<T>({
	containerRef,
	storeRef,
	onEventRef,
	viewedTimeout,
	markViewed,
	getViewedSlides,
	getSlideData,
}: ViewportEngagementParams<T>) {
	const engagement = useRef<EngagementState>(initialEngagementState());

	const viewedTrackingEnabled = viewedTimeout !== undefined;
	const viewedSeconds = viewedTimeout ?? DEFAULT_VIEWED_TIMEOUT;
	const viewedSecondsRef = useRef(viewedSeconds);
	viewedSecondsRef.current = viewedSeconds;

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
				const slides: SlideData<T>[] = Array.from(
					{length: storeRef.current.slideCount},
					(_, i) => ({index: i, data: getSlideData(i)}),
				);
				onEventRef.current({event: 'carousel_reached_end', slides});
			} else {
				const elapsed = s.viewedStart
					? Math.round((Date.now() - s.viewedStart) / 1000)
					: viewedSecondsRef.current;
				onEventRef.current({
					event: 'carousel_viewed_slides',
					slides: getViewedSlides(),
					viewedSeconds: elapsed,
				});
			}
		},
		[getSlideData, getViewedSlides, storeRef, onEventRef],
	);

	useEffect(() => {
		const wrapper = containerRef.current;
		if (!wrapper) return;
		/**
		 * engagement.current is stable for the component's life — capture it once so the
		 * cleanup reads the live timer handle without an exhaustive-deps warning.
		 */
		const s = engagement.current;

		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					if (!s.inViewportFired) {
						s.inViewportFired = true;
						onEventRef.current({event: 'carousel_in_viewport'});
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
						}, viewedSecondsRef.current * 1000);
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
		onEventRef,
		viewedTrackingEnabled,
	]);

	return {fireTerminalIfNeeded};
}
