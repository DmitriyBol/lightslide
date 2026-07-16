import {renderHook} from '@testing-library/react';
import type {MouseEvent, PointerEvent} from 'react';

import {createStore} from './store';
import {useFlow} from './useFlow';

/**
 * Manual rAF control: capture the scheduled callback and drive it with explicit
 * timestamps so per-frame motion is deterministic. setTimeout (resume) is faked.
 */
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
	/** jsdom does not implement pointer capture — stub it so we can assert calls. */
	track.setPointerCapture = jest.fn();
	const params = {
		enabled: true,
		speed: 100,
		resumeDelay: 2000,
		pauseOnHover: true,
		pauseOnFocus: true,
		trackRef: {current: track},
		/**
		 * slideWidth is the cached width every flow path (rAF loop, drag, positioning) sizes
		 * its transform from — the single source of truth, read straight off the store.
		 */
		storeRef: {
			current: createStore({slideCount: 3, loopOffset: 1, slideWidth: 300}),
		},
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
		/** base = loopOffset(1) * sw(300) = 300, offset 0 */
		expect(track.style.transform).toBe('translateX(-300px)');
	});

	it('advances the offset at `speed` px per second on each frame', () => {
		const {track} = setup({speed: 100});
		frame(0);
		frame(1000); /** +100px */
		expect(track.style.transform).toBe('translateX(-400px)');
	});

	it('wraps seamlessly at one content width (modulo), with no jump', () => {
		const {track} = setup({speed: 100}); /** contentWidth = 3 * 300 = 900 */
		frame(0);
		frame(9500); /** +950px → wrap → 50px (not 950) */
		expect(track.style.transform).toBe('translateX(-350px)');
	});

	it('sizes the home offset and wrap span by the stride when gap is set', () => {
		/** stride = 300 + 20; base = loopOffset(1) · 320; contentWidth = 3 · 320 = 960. */
		const {track} = setup({
			speed: 100,
			storeRef: {
				current: createStore({
					slideCount: 3,
					loopOffset: 1,
					slideWidth: 300,
					gap: 20,
				}),
			},
		});
		expect(track.style.transform).toBe('translateX(-320px)');
		frame(0);
		frame(10000); /** +1000px → wrap at 960 → offset 40 → -(320 + 40) */
		expect(track.style.transform).toBe('translateX(-360px)');
	});

	it('pauses on interaction and resumes from where it stopped after resumeDelay', () => {
		const {result, track} = setup({speed: 100, resumeDelay: 2000});
		frame(0);
		frame(1000); /** offset 100 → -400 */
		result.current.onPointerDown(downEvent(500));
		frame(2000); /** interacting → no advance */
		expect(track.style.transform).toBe('translateX(-400px)');
		result.current.onPointerUp(moveEvent(500)); /** tap, schedules resume */
		jest.advanceTimersByTime(2000);
		frame(3000); /** dt 1000 from 2000 → +100 → offset 200 → -500 */
		expect(track.style.transform).toBe('translateX(-500px)');
	});

	it('drifts the strip from its current position during a drag (no jump on grab)', () => {
		const {result, track} = setup({speed: 100});
		frame(0);
		frame(1000); /** offset 100 → -400 */
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(450)); /** dx -50 → -(300+100) + -50 */
		expect(track.style.transform).toBe('translateX(-450px)');
		result.current.onPointerUp(moveEvent(450)); /** commit: offset = 100 - (-50) = 150 */
		expect(track.style.transform).toBe('translateX(-450px)');
	});

	it('commits the drift when the pointer leaves the carousel mid-drag', () => {
		const {result, track} = setup({speed: 100});
		frame(0);
		frame(1000); /** offset 100 → -400 */
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(450)); /** dx -50 */
		/** Leaves while still held: commit offset = 100 - (-50) = 150 → -(300 + 150) */
		result.current.onPointerLeave(moveEvent(450));
		expect(track.style.transform).toBe('translateX(-450px)');
	});

	it('aborts on pointer cancel without committing the drift, then resumes after the delay', () => {
		const {result, track} = setup({speed: 100, resumeDelay: 2000});
		frame(0);
		frame(1000); /** offset 100 → -400 */
		result.current.onPointerDown(downEvent(500)); /** offsetAtStart = 100 */
		result.current.onPointerMove(moveEvent(450)); /** dx -50 → -(300 + 100) - 50 */
		expect(track.style.transform).toBe('translateX(-450px)');
		result.current.onPointerCancel(); /** cancel: must NOT commit, only schedule resume */
		frame(2000); /** still interacting → no advance, transform unchanged */
		expect(track.style.transform).toBe('translateX(-450px)');
		jest.advanceTimersByTime(2000); /** resume timer fires → interacting false */
		/**
		 * Resumes from the UNCOMMITTED offset (100, not the dragged 150): 100 + 100 → -(300 + 200).
		 * A committed cancel would land at offset 150 → -550, so -500 proves no commit happened.
		 */
		frame(3000);
		expect(track.style.transform).toBe('translateX(-500px)');
	});

	it('holds the drift while hovered and resumes on the next frame after leave', () => {
		const storeRef = {
			current: createStore({
				slideCount: 3,
				loopOffset: 1,
				slideWidth: 300,
				hovered: true,
			}),
		};
		const {track} = setup({speed: 100, storeRef});
		frame(0);
		frame(1000); /** hovered → no advance */
		expect(track.style.transform).toBe('translateX(-300px)');

		storeRef.current.hovered = false;
		frame(2000); /** dt 1000 → +100px */
		expect(track.style.transform).toBe('translateX(-400px)');
	});

	it('holds the drift while focus is within and resumes once it leaves', () => {
		const storeRef = {
			current: createStore({
				slideCount: 3,
				loopOffset: 1,
				slideWidth: 300,
				focusWithin: true,
			}),
		};
		const {track} = setup({speed: 100, storeRef});
		frame(0);
		frame(1000);
		expect(track.style.transform).toBe('translateX(-300px)');

		storeRef.current.focusWithin = false;
		frame(2000);
		expect(track.style.transform).toBe('translateX(-400px)');
	});

	it('keeps drifting while hovered when pauseOnHover is false', () => {
		const storeRef = {
			current: createStore({
				slideCount: 3,
				loopOffset: 1,
				slideWidth: 300,
				hovered: true,
			}),
		};
		const {track} = setup({speed: 100, pauseOnHover: false, storeRef});
		frame(0);
		frame(1000);
		expect(track.style.transform).toBe('translateX(-400px)');
	});

	it('holds the drift while apiPaused even with both pause configs opted out', () => {
		const storeRef = {
			current: createStore({
				slideCount: 3,
				loopOffset: 1,
				slideWidth: 300,
				apiPaused: true,
			}),
		};
		const {track} = setup({
			speed: 100,
			pauseOnHover: false,
			pauseOnFocus: false,
			storeRef,
		});
		frame(0);
		frame(1000);
		expect(track.style.transform).toBe('translateX(-300px)');

		storeRef.current.apiPaused = false;
		frame(2000);
		expect(track.style.transform).toBe('translateX(-400px)');
	});

	it('consumes wheel mailbox deltas as extra drift and clears the mailbox', () => {
		const storeRef = {
			current: createStore({slideCount: 3, loopOffset: 1, slideWidth: 300}),
		};
		const {track} = setup({speed: 100, storeRef});
		frame(0);
		storeRef.current.wheelDeltaX = 50;
		frame(1000); /** +100 drift +50 wheel → offset 150 → -(300 + 150) */
		expect(track.style.transform).toBe('translateX(-450px)');
		expect(storeRef.current.wheelDeltaX).toBe(0);
	});

	it('applies wheel deltas even while the hover pause holds the drift', () => {
		const storeRef = {
			current: createStore({
				slideCount: 3,
				loopOffset: 1,
				slideWidth: 300,
				hovered: true,
			}),
		};
		const {track} = setup({speed: 100, storeRef});
		frame(0);
		storeRef.current.wheelDeltaX = 80;
		frame(1000); /** hovered → no speed advance; wheel-only → offset 80 */
		expect(track.style.transform).toBe('translateX(-380px)');
	});

	it('drops wheel deltas while a drag interaction owns the transform', () => {
		const storeRef = {
			current: createStore({slideCount: 3, loopOffset: 1, slideWidth: 300}),
		};
		const {result, track} = setup({speed: 100, storeRef});
		frame(0);
		result.current.onPointerDown(downEvent(500));
		storeRef.current.wheelDeltaX = 80;
		frame(1000); /** interacting → wheel dropped, no advance */
		expect(track.style.transform).toBe('translateX(-300px)');
		expect(storeRef.current.wheelDeltaX).toBe(0);
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
		result.current.onPointerMove(moveEvent(450)); /** dx -50, horizontal */
		expect(track.setPointerCapture).toHaveBeenCalledWith(1);
	});

	it('suppresses the click that follows a real drag', () => {
		const {result} = setup();
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(450)); /** real horizontal drag */
		result.current.onPointerUp(moveEvent(450));

		const {event, preventDefault, stopPropagation} = clickEvent();
		result.current.onClickCapture(event);
		expect(preventDefault).toHaveBeenCalled();
		expect(stopPropagation).toHaveBeenCalled();
	});

	it('does not suppress the click after a plain tap', () => {
		const {result} = setup();
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerUp(moveEvent(500)); /** no movement → tap */

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
