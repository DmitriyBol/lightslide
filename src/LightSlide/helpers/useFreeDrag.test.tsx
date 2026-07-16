import {renderHook} from '@testing-library/react';
import type {MouseEvent, PointerEvent} from 'react';

import {createStore} from './store';
import {useFreeDrag} from './useFreeDrag';

type Overrides = {
	snap?: boolean;
	currentIndex?: number;
	maxIndex?: number;
	isLoop?: boolean;
	loopOffset?: number;
	slidesPerView?: number;
	slideCount?: number;
	slideWidth?: number;
	gap?: number;
	restOffset?: number;
};

function setupFreeDrag(overrides: Overrides = {}) {
	const navigate = jest.fn();
	const track = document.createElement('div');
	/** jsdom does not implement pointer capture — stub it so the gesture can engage. */
	track.setPointerCapture = jest.fn();
	const store = createStore({
		currentIndex: overrides.currentIndex ?? 0,
		maxIndex: overrides.maxIndex ?? 4,
		isLoop: overrides.isLoop ?? false,
		loopOffset: overrides.loopOffset ?? 0,
		slidesPerView: overrides.slidesPerView ?? 1,
		slideCount: overrides.slideCount ?? 5,
		slideWidth: overrides.slideWidth ?? 300,
		gap: overrides.gap ?? 0,
		restOffset: overrides.restOffset ?? 0,
	});
	const storeRef = {current: store};
	const {result} = renderHook(() =>
		useFreeDrag({
			snap: overrides.snap ?? false,
			trackRef: {current: track},
			storeRef,
			goToIndex: navigate,
		}),
	);
	return {result, navigate, store, track};
}

const downEvent = (x: number, y = 100) =>
	({
		clientX: x,
		clientY: y,
		pointerId: 1,
	}) as unknown as PointerEvent<HTMLDivElement>;

const moveEvent = (x: number, y = 100) =>
	({clientX: x, clientY: y}) as unknown as PointerEvent<HTMLDivElement>;

const clickEvent = () =>
	({
		preventDefault: jest.fn(),
		stopPropagation: jest.fn(),
	}) as unknown as MouseEvent<HTMLDivElement>;

describe('useFreeDrag — free', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(0);
	});
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('drags the track from the stored rest offset, not the index boundary', () => {
		const {result, track} = setupFreeDrag({currentIndex: 1, restOffset: 450});
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(480)); /** dx -20 */
		expect(track.style.transform).toBe('translateX(-470px)');
	});

	it('applies rubber-band resistance to the out-of-bounds part only', () => {
		const {result, track} = setupFreeDrag({});
		result.current.onPointerDown(downEvent(500));
		result.current.onPointerMove(moveEvent(590)); /** raw -90 → resisted -30 */
		expect(track.style.transform).toBe('translateX(30px)');
	});

	it('settles in place on a slow release and commits the nearest index', () => {
		const {result, navigate, store, track} = setupFreeDrag({});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(moveEvent(105)); /** dx -395, fast */
		jest.setSystemTime(1100);
		result.current.onPointerMove(moveEvent(100)); /** dx -400, velocity ≈ 0 */
		result.current.onPointerUp(moveEvent(100));
		expect(navigate).toHaveBeenCalledWith(1, 'settle');
		expect(store.restOffset).toBe(400);
		expect(track.style.transform).toBe('translateX(-400px)');
		expect(store.autoScrollPaused).toBe(false);
	});

	it('coasts after a flick and settles on the nearest index where it stops', () => {
		const {result, navigate, store, track} = setupFreeDrag({});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(50);
		result.current.onPointerMove(moveEvent(425)); /** dx -75, velocity -1.5 px/ms */
		result.current.onPointerUp(moveEvent(425));
		expect(navigate).not.toHaveBeenCalled(); /** still coasting */
		jest.advanceTimersByTime(2000);
		/** ~1.5 px/ms × 325 ms decay ≈ +490 px of coast → rests ≈ 560-570 → nearest index 2. */
		expect(navigate).toHaveBeenCalledWith(2, 'settle');
		expect(track.style.transform).toBe(`translateX(${-store.restOffset}px)`);
		expect(store.autoScrollPaused).toBe(false);
	});

	it('clamps the coast at the last-slide edge', () => {
		/** 5 slides × 300 px, slidesPerView 1 → max offset 1200. */
		const {result, navigate, store, track} = setupFreeDrag({
			currentIndex: 3,
			restOffset: 1000,
		});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(50);
		result.current.onPointerMove(moveEvent(350)); /** dx -150, velocity -3 px/ms */
		result.current.onPointerUp(moveEvent(350));
		jest.advanceTimersByTime(2000);
		expect(navigate).toHaveBeenCalledWith(4, 'settle');
		expect(store.restOffset).toBe(1200);
		expect(track.style.transform).toBe('translateX(-1200px)');
	});

	it('snaps back through the drag path when released past the edge', () => {
		const {result, navigate, store} = setupFreeDrag({});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(moveEvent(620)); /** dx +120 → overscrolled */
		result.current.onPointerUp(moveEvent(620));
		expect(navigate).toHaveBeenCalledWith(0, 'drag');
		expect(store.autoScrollPaused).toBe(false);
	});

	it('wraps the coast through the loop clones and commits the logical index', () => {
		/** 5 slides × 300 px, loopOffset 1 → base 300, span 1500; rest at visual 5 = logical 4. */
		const {result, navigate} = setupFreeDrag({
			currentIndex: 4,
			isLoop: true,
			loopOffset: 1,
			restOffset: 1500,
		});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(50);
		result.current.onPointerMove(moveEvent(350)); /** dx -150, velocity -3 px/ms */
		result.current.onPointerUp(moveEvent(350));
		jest.advanceTimersByTime(3000);
		/** 1650 + ~975 coast ≈ 2630 → wrapped ≈ 1130 → visual 4 → logical 3. */
		expect(navigate).toHaveBeenCalledWith(3, 'settle');
	});

	it('lets a grab catch a coasting track and drag on from where it was caught', () => {
		const {result, navigate, store, track} = setupFreeDrag({});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(50);
		result.current.onPointerMove(moveEvent(425)); /** dx -75, velocity -1.5 px/ms */
		result.current.onPointerUp(moveEvent(425));
		jest.advanceTimersByTime(100); /** mid-coast */
		result.current.onPointerDown(downEvent(500));
		expect(store.restOffset).toBeGreaterThan(75); /** the coast had moved it on */
		const frozen = track.style.transform;
		jest.advanceTimersByTime(2000); /** the cancelled coast must not settle or move */
		expect(track.style.transform).toBe(frozen);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('suppresses the click that follows a real drag', () => {
		const {result} = setupFreeDrag({});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(50);
		result.current.onPointerMove(moveEvent(425));
		result.current.onPointerUp(moveEvent(425));
		const click = clickEvent();
		result.current.onClickCapture(click);
		expect(click.preventDefault).toHaveBeenCalled();
	});

	it('returns to the current boundary through the drag path on cancel', () => {
		const {result, navigate} = setupFreeDrag({currentIndex: 2});
		result.current.onPointerCancel();
		expect(navigate).toHaveBeenCalledWith(2, 'drag');
	});
});

describe('useFreeDrag — free-snap', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(0);
	});
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('projects the momentum and snaps to the boundary nearest the coast endpoint', () => {
		const {result, navigate} = setupFreeDrag({snap: true});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(moveEvent(400)); /** dx -100, velocity -1 px/ms */
		result.current.onPointerUp(moveEvent(400));
		/** 100 px dragged + 1 px/ms × 325 ms projected = 425 → nearest boundary is index 1. */
		expect(navigate).toHaveBeenCalledWith(1, 'drag');
	});

	it('lands on the nearest boundary with no momentum — no snap threshold', () => {
		const {result, navigate} = setupFreeDrag({snap: true});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(moveEvent(365));
		jest.setSystemTime(1100);
		result.current.onPointerMove(moveEvent(360)); /** dx -140, velocity ≈ 0 */
		result.current.onPointerUp(moveEvent(360));
		/** 140 px < half a slide, yet nearest is still index 0 by rounding, not thresholds. */
		expect(navigate).toHaveBeenCalledWith(0, 'drag');
	});

	it('accounts for the loop clone offset when picking the boundary', () => {
		const {result, navigate} = setupFreeDrag({
			snap: true,
			currentIndex: 1,
			isLoop: true,
			loopOffset: 2,
			restOffset: 900,
		});
		result.current.onPointerDown(downEvent(500));
		jest.setSystemTime(100);
		result.current.onPointerMove(moveEvent(400)); /** dx -100, velocity -1 px/ms */
		result.current.onPointerUp(moveEvent(400));
		/** 1000 + 325 projected = 1325 → visual 4 → logical 4 − loopOffset 2 = 2. */
		expect(navigate).toHaveBeenCalledWith(2, 'drag');
	});
});
