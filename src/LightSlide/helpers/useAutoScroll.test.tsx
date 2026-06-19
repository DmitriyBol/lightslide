import {act, renderHook} from '@testing-library/react';

import type {NavigateFn} from './navigation';
import {useAutoScroll} from './useAutoScroll';

type Overrides = {
	currentIndex?: number;
	maxIndex?: number;
	isLoop?: boolean;
	paused?: boolean;
};

function setup(
	config: {enabled: boolean; interval: number},
	overrides: Overrides = {},
) {
	const navigate = jest.fn<ReturnType<NavigateFn>, Parameters<NavigateFn>>();
	renderHook(() =>
		useAutoScroll(config, {
			currentIndexRef: {current: overrides.currentIndex ?? 0},
			maxIndexRef: {current: overrides.maxIndex ?? 3},
			isLoopRef: {current: overrides.isLoop ?? false},
			autoScrollPausedRef: {current: overrides.paused ?? false},
			navigateToIndexRef: {current: navigate},
		}),
	);
	return navigate;
}

describe('useAutoScroll', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('advances forward on each interval tick', () => {
		const navigate = setup({enabled: true, interval: 1000}, {currentIndex: 1});
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(2, 'auto');
	});

	it('wraps back to 0 at the end when not looping', () => {
		const navigate = setup(
			{enabled: true, interval: 1000},
			{currentIndex: 3, maxIndex: 3},
		);
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(0, 'auto');
	});

	it('keeps advancing past the end when looping (wrap handled downstream)', () => {
		const navigate = setup(
			{enabled: true, interval: 1000},
			{currentIndex: 3, maxIndex: 3, isLoop: true},
		);
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(4, 'auto');
	});

	it('does nothing while paused', () => {
		const navigate = setup({enabled: true, interval: 1000}, {paused: true});
		act(() => jest.advanceTimersByTime(3000));
		expect(navigate).not.toHaveBeenCalled();
	});

	it('does not start a timer when disabled', () => {
		const navigate = setup({enabled: false, interval: 1000});
		act(() => jest.advanceTimersByTime(5000));
		expect(navigate).not.toHaveBeenCalled();
	});
});
