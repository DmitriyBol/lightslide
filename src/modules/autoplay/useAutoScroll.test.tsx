import {act, renderHook} from '@testing-library/react';

import type {NavigateFn} from '../../LightSlide/helpers/navigation';
import {createStore} from '../../LightSlide/helpers/store';
import {useAutoScroll} from './useAutoScroll';

type Overrides = {
	currentIndex?: number;
	maxIndex?: number;
	isLoop?: boolean;
	paused?: boolean;
	hovered?: boolean;
	focusWithin?: boolean;
	apiPaused?: boolean;
};

type Config = {
	enabled: boolean;
	interval: number;
	pauseOnHover?: boolean;
	pauseOnFocus?: boolean;
};

function setup(config: Config, overrides: Overrides = {}) {
	const navigate = jest.fn<ReturnType<NavigateFn>, Parameters<NavigateFn>>();
	const storeRef = {
		current: createStore({
			currentIndex: overrides.currentIndex ?? 0,
			maxIndex: overrides.maxIndex ?? 3,
			isLoop: overrides.isLoop ?? false,
			autoScrollPaused: overrides.paused ?? false,
			hovered: overrides.hovered ?? false,
			focusWithin: overrides.focusWithin ?? false,
			apiPaused: overrides.apiPaused ?? false,
		}),
	};
	renderHook(() =>
		useAutoScroll({
			enabled: config.enabled,
			interval: config.interval,
			pauseOnHover: config.pauseOnHover ?? true,
			pauseOnFocus: config.pauseOnFocus ?? true,
			storeRef,
			goToIndex: navigate,
		}),
	);
	return {navigate, storeRef};
}

describe('useAutoScroll', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('advances forward on each interval tick', () => {
		const {navigate} = setup(
			{enabled: true, interval: 1000},
			{currentIndex: 1},
		);
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(2, 'auto');
	});

	it('wraps back to 0 at the end when not looping', () => {
		const {navigate} = setup(
			{enabled: true, interval: 1000},
			{currentIndex: 3, maxIndex: 3},
		);
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(0, 'auto');
	});

	it('keeps advancing past the end when looping (wrap handled downstream)', () => {
		const {navigate} = setup(
			{enabled: true, interval: 1000},
			{currentIndex: 3, maxIndex: 3, isLoop: true},
		);
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(4, 'auto');
	});

	it('does nothing while paused', () => {
		const {navigate} = setup({enabled: true, interval: 1000}, {paused: true});
		act(() => jest.advanceTimersByTime(3000));
		expect(navigate).not.toHaveBeenCalled();
	});

	it('does not start a timer when disabled', () => {
		const {navigate} = setup({enabled: false, interval: 1000});
		act(() => jest.advanceTimersByTime(5000));
		expect(navigate).not.toHaveBeenCalled();
	});

	it('holds while hovered by default and resumes once the pointer leaves', () => {
		const {navigate, storeRef} = setup(
			{enabled: true, interval: 1000},
			{hovered: true},
		);
		act(() => jest.advanceTimersByTime(3000));
		expect(navigate).not.toHaveBeenCalled();

		storeRef.current.hovered = false;
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(1, 'auto');
	});

	it('holds while focus is within by default and resumes once it leaves', () => {
		const {navigate, storeRef} = setup(
			{enabled: true, interval: 1000},
			{focusWithin: true},
		);
		act(() => jest.advanceTimersByTime(3000));
		expect(navigate).not.toHaveBeenCalled();

		storeRef.current.focusWithin = false;
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(1, 'auto');
	});

	it('keeps advancing while hovered when pauseOnHover is false', () => {
		const {navigate} = setup(
			{enabled: true, interval: 1000, pauseOnHover: false},
			{hovered: true},
		);
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(1, 'auto');
	});

	it('keeps advancing while focused when pauseOnFocus is false', () => {
		const {navigate} = setup(
			{enabled: true, interval: 1000, pauseOnFocus: false},
			{focusWithin: true},
		);
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(1, 'auto');
	});

	it('holds while apiPaused even with both pause configs opted out', () => {
		const {navigate, storeRef} = setup(
			{enabled: true, interval: 1000, pauseOnHover: false, pauseOnFocus: false},
			{apiPaused: true},
		);
		act(() => jest.advanceTimersByTime(3000));
		expect(navigate).not.toHaveBeenCalled();

		storeRef.current.apiPaused = false;
		act(() => jest.advanceTimersByTime(1000));
		expect(navigate).toHaveBeenCalledWith(1, 'auto');
	});
});
