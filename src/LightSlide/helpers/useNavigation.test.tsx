import {renderHook} from '@testing-library/react';

import type {AnalyticsConfig} from '../../types';
import type {LightSlideStore} from './store';
import {createStore} from './store';
import {useNavigation} from './useNavigation';

function setupNavigation(overrides: Partial<LightSlideStore> = {}) {
	const store = createStore({
		currentIndex: 1,
		maxIndex: 4,
		slideCount: 5,
		slideWidth: 300,
		...overrides,
	});
	const storeRef = {current: store};
	const onEvent = jest.fn();
	const analyticsRef = {current: {onEvent} as AnalyticsConfig};
	const onIndexChange = jest.fn();
	const onIndexChangeRef = {current: onIndexChange};
	const setCurrentIndex = jest.fn();
	const markViewed = jest.fn();
	const fireTerminalIfNeeded = jest.fn();
	const snapToVisual = jest.fn();
	const {result} = renderHook(() =>
		useNavigation({
			storeRef,
			analyticsRef,
			onIndexChangeRef,
			setCurrentIndex,
			markViewed,
			fireTerminalIfNeeded,
			snapToVisual,
		}),
	);
	return {
		navigate: result.current,
		store,
		onEvent,
		onIndexChange,
		setCurrentIndex,
		fireTerminalIfNeeded,
		snapToVisual,
	};
}

describe('useNavigation — settle source', () => {
	afterEach(() => jest.clearAllMocks());

	it('commits state and analytics but never snaps the track', () => {
		const {navigate, store, onEvent, setCurrentIndex, onIndexChange, snapToVisual} =
			setupNavigation({restOffset: 700});
		navigate(2, 'settle');
		expect(store.currentIndex).toBe(2);
		expect(setCurrentIndex).toHaveBeenCalledWith(2);
		expect(onIndexChange).toHaveBeenCalledWith(2);
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'right',
			fromIndex: 1,
			toIndex: 2,
		});
		expect(snapToVisual).not.toHaveBeenCalled();
	});

	it('is silent when the coast rests on the index it started from', () => {
		const {navigate, onEvent, setCurrentIndex, snapToVisual} = setupNavigation({
			restOffset: 350,
		});
		navigate(1, 'settle');
		expect(onEvent).not.toHaveBeenCalled();
		expect(setCurrentIndex).not.toHaveBeenCalled();
		expect(snapToVisual).not.toHaveBeenCalled();
	});

	it('clamps in loop mode instead of triggering the wrap dance', () => {
		const {navigate, store, setCurrentIndex, snapToVisual} = setupNavigation({
			isLoop: true,
			loopOffset: 2,
			slidesPerView: 2,
			maxIndex: 3,
		});
		navigate(4, 'settle');
		expect(store.currentIndex).toBe(3);
		expect(setCurrentIndex).toHaveBeenCalledWith(3);
		expect(snapToVisual).not.toHaveBeenCalled();
	});

	it('arms the reachedEnd terminal when the coast rests on the last index', () => {
		const {navigate, fireTerminalIfNeeded} = setupNavigation({
			restOffset: 700,
		});
		navigate(4, 'settle');
		expect(fireTerminalIfNeeded).toHaveBeenCalledWith('reachedEnd');
	});
});

describe('useNavigation — loop wrap dance', () => {
	afterEach(() => jest.clearAllMocks());

	const loopStore = {
		isLoop: true,
		loopOffset: 1,
		slidesPerView: 1,
		maxIndex: 4,
		slideCount: 5,
	};

	it('next past the end animates onto the edge clone, then silently re-snaps to the real slide', () => {
		const {navigate, store, onEvent, snapToVisual} = setupNavigation({
			...loopStore,
			currentIndex: 4,
		});
		navigate(5, 'button');
		expect(store.currentIndex).toBe(0);
		expect(snapToVisual).toHaveBeenCalledTimes(1);
		expect(snapToVisual).toHaveBeenCalledWith(6, true, expect.any(Function));
		const [, , onComplete] = snapToVisual.mock.calls[0] as [
			number,
			boolean,
			() => void,
		];
		onComplete();
		expect(snapToVisual).toHaveBeenLastCalledWith(1, false);
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'right',
			fromIndex: 4,
			toIndex: 0,
		});
	});

	it('prev from the first slide wraps with direction "left" — the true motion, not the index delta', () => {
		const {navigate, store, onEvent, fireTerminalIfNeeded, snapToVisual} =
			setupNavigation({...loopStore, currentIndex: 0});
		navigate(-1, 'button');
		expect(store.currentIndex).toBe(4);
		expect(snapToVisual).toHaveBeenCalledWith(0, true, expect.any(Function));
		const [, , onComplete] = snapToVisual.mock.calls[0] as [
			number,
			boolean,
			() => void,
		];
		onComplete();
		expect(snapToVisual).toHaveBeenLastCalledWith(5, false);
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'left',
			fromIndex: 0,
			toIndex: 4,
		});
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_nav_button',
			direction: 'left',
			fromIndex: 0,
			toIndex: 4,
		});
		/** Landing on maxIndex via a wrap is not "reaching the end". */
		expect(fireTerminalIfNeeded).not.toHaveBeenCalled();
	});

	it('targets maxIndex’s pre-wrap twin, not visual 0, with a fractional slidesPerView', () => {
		/**
		 * count 5, spv 1.5 → maxIndex 4, loopOffset 2. The twin of visual maxIdx + offset = 6
		 * one content-width left is 6 − 5 = 1; animating to 0 instead would land a full
		 * stride short and jump at the silent re-snap.
		 */
		const {navigate, snapToVisual} = setupNavigation({
			isLoop: true,
			loopOffset: 2,
			slidesPerView: 1.5,
			maxIndex: 4,
			slideCount: 5,
			currentIndex: 0,
		});
		navigate(-1, 'button');
		expect(snapToVisual).toHaveBeenCalledWith(1, true, expect.any(Function));
		const [, , onComplete] = snapToVisual.mock.calls[0] as [
			number,
			boolean,
			() => void,
		];
		onComplete();
		expect(snapToVisual).toHaveBeenLastCalledWith(6, false);
	});
});

describe('useNavigation — per-source analytics', () => {
	afterEach(() => jest.clearAllMocks());

	it('a button navigation emits carousel_nav_button alongside carousel_slide', () => {
		const {navigate, onEvent} = setupNavigation();
		navigate(2, 'button');
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'right',
			fromIndex: 1,
			toIndex: 2,
		});
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_nav_button',
			direction: 'right',
			fromIndex: 1,
			toIndex: 2,
		});
	});

	it('a pagination navigation emits carousel_pagination_click and no nav-button event', () => {
		const {navigate, onEvent} = setupNavigation();
		navigate(3, 'pagination');
		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_pagination_click',
			fromIndex: 1,
			toIndex: 3,
		});
		const kinds = onEvent.mock.calls.map(
			([event]: [{event: string}]) => event.event,
		);
		expect(kinds).not.toContain('carousel_nav_button');
	});

	it('a drag navigation emits only carousel_slide', () => {
		const {navigate, onEvent} = setupNavigation();
		navigate(2, 'drag');
		expect(onEvent).toHaveBeenCalledTimes(1);
	});
});

describe('useNavigation — off-boundary re-align', () => {
	afterEach(() => jest.clearAllMocks());

	it('re-aligns the track when a user trigger targets the current index off-boundary', () => {
		/** Free-mode rest at 500 px; index 2's boundary is 600 px. */
		const {navigate, onEvent, snapToVisual} = setupNavigation({
			currentIndex: 2,
			restOffset: 500,
		});
		navigate(2, 'pagination');
		expect(snapToVisual).toHaveBeenCalledWith(2, true);
		expect(onEvent).not.toHaveBeenCalled();
	});

	it('stays put when the same trigger finds the track already on its boundary', () => {
		const {navigate, snapToVisual} = setupNavigation({
			currentIndex: 2,
			restOffset: 600,
		});
		navigate(2, 'pagination');
		expect(snapToVisual).not.toHaveBeenCalled();
	});

	it('keeps the unconditional snap-back for a same-index drag release', () => {
		const {navigate, snapToVisual} = setupNavigation({
			currentIndex: 2,
			restOffset: 600,
		});
		navigate(2, 'drag');
		expect(snapToVisual).toHaveBeenCalledWith(2, true);
	});
});
