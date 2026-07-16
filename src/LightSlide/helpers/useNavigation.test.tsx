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
