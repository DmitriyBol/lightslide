import {renderHook} from '@testing-library/react';

import {createStore} from '../../LightSlide/helpers/store';
import type {AnalyticsEvent} from './Analytics.types';
import {useViewportEngagement} from './useViewportEngagement';

/** ── IntersectionObserver mock ────────────────────────────────────────────── */
type IOCallback = (entries: IntersectionObserverEntry[]) => void;
let triggerIO: (isIntersecting: boolean) => void = () => {};

class MockIntersectionObserver {
	constructor(private cb: IOCallback) {
		triggerIO = (isIntersecting: boolean) => {
			cb([{isIntersecting} as IntersectionObserverEntry]);
		};
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeAll(() => {
	Object.defineProperty(global, 'IntersectionObserver', {
		writable: true,
		value: MockIntersectionObserver,
	});
});

/** ────────────────────────────────────────────────────────────────────────── */

function setupEngagement(viewedTimeout?: number) {
	const container = document.createElement('div');
	const store = createStore({
		slideCount: 3,
		maxIndex: 2,
		currentIndex: 0,
	});
	const storeRef = {current: store};
	const onEvent = jest.fn<void, [AnalyticsEvent]>();
	const markViewed = jest.fn();
	const getViewedSlides = jest.fn(() => [{index: 0, data: undefined}]);
	const getSlideData = jest.fn(() => undefined);
	const {result, unmount} = renderHook(() =>
		useViewportEngagement({
			containerRef: {current: container},
			storeRef,
			onEventRef: {current: onEvent},
			viewedTimeout,
			markViewed,
			getViewedSlides,
			getSlideData,
		}),
	);
	return {result, onEvent, markViewed, unmount};
}

describe('useViewportEngagement', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('fires carousel_in_viewport on the first visibility only', () => {
		const {onEvent} = setupEngagement();
		triggerIO(true);
		triggerIO(false);
		triggerIO(true);
		const inViewport = onEvent.mock.calls.filter(
			([event]) => event.event === 'carousel_in_viewport',
		);
		expect(inViewport).toHaveLength(1);
	});

	it('marks the current slide viewed when visibility starts', () => {
		const {markViewed} = setupEngagement(30);
		triggerIO(true);
		expect(markViewed).toHaveBeenCalledWith(0);
	});

	it('never starts the viewed count without a viewedTimeout (opt-in)', () => {
		const {onEvent} = setupEngagement(undefined);
		triggerIO(true);
		jest.advanceTimersByTime(600_000);
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).not.toContain('carousel_viewed_slides');
	});

	it('clears the viewed timer when visibility is lost mid-count', () => {
		const {onEvent} = setupEngagement(30);
		triggerIO(true);
		jest.advanceTimersByTime(15_000);
		triggerIO(false);
		jest.advanceTimersByTime(60_000);
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).not.toContain('carousel_viewed_slides');
	});

	it('restarts the count on re-entry and reports the visible streak, not the total age', () => {
		const {onEvent} = setupEngagement(30);
		triggerIO(true);
		jest.advanceTimersByTime(15_000);
		triggerIO(false);
		jest.advanceTimersByTime(60_000);
		triggerIO(true);
		jest.advanceTimersByTime(30_000);
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_viewed_slides',
			slides: [{index: 0, data: undefined}],
			viewedSeconds: 30,
		});
	});

	it('never fires the viewed terminal after reachedEnd claimed the slot', () => {
		const {result, onEvent} = setupEngagement(30);
		result.current.fireTerminalIfNeeded('reachedEnd');
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_reached_end',
			slides: [
				{index: 0, data: undefined},
				{index: 1, data: undefined},
				{index: 2, data: undefined},
			],
		});
		triggerIO(true);
		jest.advanceTimersByTime(120_000);
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).not.toContain('carousel_viewed_slides');
	});

	it('unmounting mid-count cancels the pending viewed timer', () => {
		const {onEvent, unmount} = setupEngagement(30);
		triggerIO(true);
		jest.advanceTimersByTime(15_000);
		unmount();
		jest.advanceTimersByTime(60_000);
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).not.toContain('carousel_viewed_slides');
	});
});
