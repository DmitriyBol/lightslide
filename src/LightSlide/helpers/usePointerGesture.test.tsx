import {renderHook} from '@testing-library/react';
import type {MouseEvent, PointerEvent} from 'react';

import {usePointerGesture} from './usePointerGesture';

function setup() {
	const onStart = jest.fn();
	const onMove = jest.fn();
	const onEnd = jest.fn();
	const onCancel = jest.fn();
	const track = document.createElement('div');
	// jsdom does not implement pointer capture — stub it so we can assert calls.
	track.setPointerCapture = jest.fn();
	const {result} = renderHook(() =>
		usePointerGesture({
			trackRef: {current: track},
			onStart,
			onMove,
			onEnd,
			onCancel,
		}),
	);
	return {result, onStart, onMove, onEnd, onCancel, track};
}

const down = (x: number, y = 100) =>
	({clientX: x, clientY: y, pointerId: 1}) as unknown as PointerEvent<HTMLDivElement>;

const move = (x: number, y = 100) =>
	({clientX: x, clientY: y}) as unknown as PointerEvent<HTMLDivElement>;

const clickEvent = () => {
	const preventDefault = jest.fn();
	const stopPropagation = jest.fn();
	return {
		event: {preventDefault, stopPropagation} as unknown as MouseEvent<HTMLDivElement>,
		preventDefault,
		stopPropagation,
	};
};

describe('usePointerGesture', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(0);
	});
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('calls onStart on pointer down without capturing yet (a tap reaches child links)', () => {
		const {result, onStart, track} = setup();
		result.current.onPointerDown(down(500));
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(track.setPointerCapture).not.toHaveBeenCalled();
	});

	it('ignores movement below the direction-lock threshold', () => {
		const {result, onMove, track} = setup();
		result.current.onPointerDown(down(500));
		result.current.onPointerMove(move(502)); // dx 2 < lock
		expect(onMove).not.toHaveBeenCalled();
		expect(track.setPointerCapture).not.toHaveBeenCalled();
	});

	it('locks horizontal: captures the pointer and emits onMove with the signed delta', () => {
		const {result, onMove, track} = setup();
		result.current.onPointerDown(down(500));
		result.current.onPointerMove(move(470)); // dx -30, horizontal
		expect(track.setPointerCapture).toHaveBeenCalledWith(1);
		expect(onMove).toHaveBeenCalledWith(-30);
	});

	it('abandons on vertical intent as a no-commit end (moved=false), no capture', () => {
		const {result, onMove, onEnd, track} = setup();
		result.current.onPointerDown(down(500, 100));
		result.current.onPointerMove(move(495, 170)); // dy 70 > dx 5 → vertical
		expect(onMove).not.toHaveBeenCalled();
		expect(track.setPointerCapture).not.toHaveBeenCalled();
		expect(onEnd).toHaveBeenCalledWith(0, 0, false);
	});

	it('commits on pointer up after a real drag (moved=true) with the release delta and velocity', () => {
		const {result, onEnd} = setup();
		result.current.onPointerDown(down(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(move(300)); // dx -200 over 100ms → velocity -2
		result.current.onPointerUp(move(300));
		expect(onEnd).toHaveBeenCalledWith(-200, -2, true);
	});

	it('treats a tap (no movement) as a no-commit end on release', () => {
		const {result, onEnd} = setup();
		result.current.onPointerDown(down(500));
		result.current.onPointerUp(move(500));
		expect(onEnd).toHaveBeenCalledWith(0, 0, false);
	});

	it('commits on a pointer leave mid-drag (stuck-gesture safety net)', () => {
		const {result, onEnd} = setup();
		result.current.onPointerDown(down(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(move(300));
		result.current.onPointerLeave(move(300));
		expect(onEnd).toHaveBeenCalledWith(-200, -2, true);
	});

	it('ignores a pointer leave when no gesture is in progress', () => {
		const {result, onEnd} = setup();
		result.current.onPointerLeave(move(500));
		expect(onEnd).not.toHaveBeenCalled();
	});

	it('fires onCancel unconditionally on pointer cancel (even with no active gesture)', () => {
		const {result, onCancel} = setup();
		result.current.onPointerCancel();
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('suppresses the click that follows a real drag, exactly once', () => {
		const {result} = setup();
		result.current.onPointerDown(down(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(move(300));
		result.current.onPointerUp(move(300));

		const first = clickEvent();
		result.current.onClickCapture(first.event);
		expect(first.preventDefault).toHaveBeenCalled();
		expect(first.stopPropagation).toHaveBeenCalled();

		const second = clickEvent();
		result.current.onClickCapture(second.event);
		expect(second.preventDefault).not.toHaveBeenCalled();
	});

	it('does not suppress the click after a plain tap', () => {
		const {result} = setup();
		result.current.onPointerDown(down(500));
		result.current.onPointerUp(move(500)); // no movement → tap

		const {event, preventDefault} = clickEvent();
		result.current.onClickCapture(event);
		expect(preventDefault).not.toHaveBeenCalled();
	});
});
