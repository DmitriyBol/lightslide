import {renderHook} from '@testing-library/react';
import type {PointerEvent} from 'react';

import {useDragGesture} from './useDragGesture';

type Overrides = {
	currentIndex?: number;
	maxIndex?: number;
	isLoop?: boolean;
	loopOffset?: number;
	pausedRef?: {current: boolean};
};

function setupDrag(overrides: Overrides = {}) {
	const navigate = jest.fn();
	const snapToVisual = jest.fn();
	const pausedRef = overrides.pausedRef ?? {current: false};
	const track = document.createElement('div');
	const {result} = renderHook(() =>
		useDragGesture({
			trackRef: {current: track},
			currentIndexRef: {current: overrides.currentIndex ?? 1},
			maxIndexRef: {current: overrides.maxIndex ?? 4},
			isLoopRef: {current: overrides.isLoop ?? false},
			loopOffsetRef: {current: overrides.loopOffset ?? 0},
			autoScrollPausedRef: pausedRef,
			getComputedSlideWidth: () => 300,
			snapToVisual,
			navigateToIndex: navigate,
		}),
	);
	return {result, navigate, snapToVisual, pausedRef, track};
}

const downEvent = (x: number, y = 100, setPointerCapture = jest.fn()) =>
	({
		clientX: x,
		clientY: y,
		pointerId: 1,
		currentTarget: {setPointerCapture},
	}) as unknown as PointerEvent<HTMLDivElement>;

const moveEvent = (x: number, y = 100) =>
	({clientX: x, clientY: y}) as unknown as PointerEvent<HTMLDivElement>;

describe('useDragGesture', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(0);
	});
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('captures the pointer and pauses auto-scroll on pointer down', () => {
		const setPointerCapture = jest.fn();
		const {result, pausedRef} = setupDrag();
		result.current.onPointerDown(downEvent(500, 100, setPointerCapture));
		expect(setPointerCapture).toHaveBeenCalledWith(1);
		expect(pausedRef.current).toBe(true);
	});

	it('advances one slide on a horizontal drag past the distance threshold', () => {
		const {result, navigate, pausedRef} = setupDrag({currentIndex: 1});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(moveEvent(280)); // dx -220, horizontal
		result.current.onPointerUp(moveEvent(280));
		expect(navigate).toHaveBeenCalledWith(2, 'drag');
		expect(pausedRef.current).toBe(false); // resumed on release
	});

	it('requests a snap-back (same index) on a short, slow drag', () => {
		const {result, navigate} = setupDrag({currentIndex: 1});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(1000); // slow → velocity below threshold
		result.current.onPointerMove(moveEvent(470)); // dx -30, below distance threshold
		result.current.onPointerUp(moveEvent(470));
		expect(navigate).toHaveBeenCalledWith(1, 'drag');
	});

	it('does not navigate on a tap with no movement', () => {
		const {result, navigate} = setupDrag({currentIndex: 1});
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerUp(moveEvent(500));
		expect(navigate).not.toHaveBeenCalled();
	});

	it('cancels the drag on vertical intent and resumes auto-scroll', () => {
		const {result, navigate, pausedRef} = setupDrag({currentIndex: 1});
		result.current.onPointerDown(downEvent(500, 100));
		result.current.onPointerMove(moveEvent(495, 170)); // dy 70 > dx 5 → vertical
		result.current.onPointerUp(moveEvent(495, 170));
		expect(navigate).not.toHaveBeenCalled();
		expect(pausedRef.current).toBe(false);
	});

	it('snaps to the current visual position (logical + loopOffset) on cancel', () => {
		const {result, snapToVisual} = setupDrag({
			currentIndex: 2,
			isLoop: true,
			loopOffset: 3,
		});
		result.current.onPointerCancel();
		expect(snapToVisual).toHaveBeenCalledWith(5, true);
	});
});
