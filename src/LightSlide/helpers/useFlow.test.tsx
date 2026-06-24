import {renderHook} from '@testing-library/react';
import type {MouseEvent, PointerEvent} from 'react';

import {useFlow} from './useFlow';

// Manual rAF control: capture the scheduled callback and drive it with explicit
// timestamps so per-frame motion is deterministic. setTimeout (resume) is faked.
let frameCb: FrameRequestCallback | null = null;

const downEvent = (x: number, y = 100) =>
	({
		clientX: x,
		clientY: y,
		pointerId: 1,
		currentTarget: {setPointerCapture: jest.fn()},
	}) as unknown as PointerEvent<HTMLDivElement>;

const moveEvent = (x: number, y = 100) =>
	({clientX: x, clientY: y}) as unknown as PointerEvent<HTMLDivElement>;

const clickEvent = () => {
	const preventDefault = jest.fn();
	const stopPropagation = jest.fn();
	return {
		event: {
			preventDefault,
			stopPropagation,
		} as unknown as MouseEvent<HTMLDivElement>,
		preventDefault,
		stopPropagation,
	};
};

function setup(overrides: Record<string, unknown> = {}) {
	const track = document.createElement('div');
	// jsdom does not implement pointer capture — stub it so we can assert calls.
	track.setPointerCapture = jest.fn();
	const params = {
		enabled: true,
		speed: 100,
		resumeDelay: 2000,
		trackRef: {current: track},
		slideCountRef: {current: 3},
		loopOffsetRef: {current: 1},
		getComputedSlideWidth: () => 300,
		...overrides,
	};
	const {result} = renderHook(() =>
		useFlow(params as Parameters<typeof useFlow>[0]),
	);
	return {result, track};
}

function frame(ts: number) {
	const cb = frameCb;
	frameCb = null;
	if (cb) cb(ts);
}

describe('useFlow', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		frameCb = null;
		jest
			.spyOn(window, 'requestAnimationFrame')
			.mockImplementation((cb: FrameRequestCallback) => {
				frameCb = cb;
				return 1;
			});
		jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
	});
	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it('positions the track at the home offset before first paint (no clone flash)', () => {
		const {track} = setup();
		// base = loopOffset(1) * sw(300) = 300, offset 0
		expect(track.style.transform).toBe('translateX(-300px)');
	});

	it('advances the offset at `speed` px per second on each frame', () => {
		const {track} = setup({speed: 100});
		frame(0);
		frame(1000); // +100px
		expect(track.style.transform).toBe('translateX(-400px)');
	});

	it('wraps seamlessly at one content width (modulo), with no jump', () => {
		const {track} = setup({speed: 100}); // contentWidth = 3 * 300 = 900
		frame(0);
		frame(9500); // +950px → wrap → 50px (not 950)
		expect(track.style.transform).toBe('translateX(-350px)');
	});

	it('pauses on interaction and resumes from where it stopped after resumeDelay', () => {
		const {result, track} = setup({speed: 100, resumeDelay: 2000});
		frame(0);
		frame(1000); // offset 100 → -400
		result.current.onPointerDown(downEvent(500));
		frame(2000); // interacting → no advance
		expect(track.style.transform).toBe('translateX(-400px)');
		result.current.onPointerUp(moveEvent(500)); // tap, schedules resume
		jest.advanceTimersByTime(2000);
		frame(3000); // dt 1000 from 2000 → +100 → offset 200 → -500
		expect(track.style.transform).toBe('translateX(-500px)');
	});

	it('drifts the strip from its current position during a drag (no jump on grab)', () => {
		const {result, track} = setup({speed: 100});
		frame(0);
		frame(1000); // offset 100 → -400
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(450)); // dx -50 → -(300+100) + -50
		expect(track.style.transform).toBe('translateX(-450px)');
		result.current.onPointerUp(moveEvent(450)); // commit: offset = 100 - (-50) = 150
		expect(track.style.transform).toBe('translateX(-450px)');
	});

	it('does not schedule any frame when disabled', () => {
		const {track} = setup({enabled: false});
		expect(window.requestAnimationFrame).not.toHaveBeenCalled();
		expect(track.style.transform).toBe('');
	});

	it('does not capture the pointer on down (a tap reaches child links)', () => {
		const {result, track} = setup();
		result.current.onPointerDown(downEvent(500));
		expect(track.setPointerCapture).not.toHaveBeenCalled();
	});

	it('captures the pointer once a real horizontal drag begins', () => {
		const {result, track} = setup();
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(450)); // dx -50, horizontal
		expect(track.setPointerCapture).toHaveBeenCalledWith(1);
	});

	it('suppresses the click that follows a real drag', () => {
		const {result} = setup();
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(450)); // real horizontal drag
		result.current.onPointerUp(moveEvent(450));

		const {event, preventDefault, stopPropagation} = clickEvent();
		result.current.onClickCapture(event);
		expect(preventDefault).toHaveBeenCalled();
		expect(stopPropagation).toHaveBeenCalled();
	});

	it('does not suppress the click after a plain tap', () => {
		const {result} = setup();
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerUp(moveEvent(500)); // no movement → tap

		const {event, preventDefault} = clickEvent();
		result.current.onClickCapture(event);
		expect(preventDefault).not.toHaveBeenCalled();
	});

	it('only suppresses one click per drag', () => {
		const {result} = setup();
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(450));
		result.current.onPointerUp(moveEvent(450));

		const first = clickEvent();
		result.current.onClickCapture(first.event);
		expect(first.preventDefault).toHaveBeenCalled();

		const second = clickEvent();
		result.current.onClickCapture(second.event);
		expect(second.preventDefault).not.toHaveBeenCalled();
	});
});
