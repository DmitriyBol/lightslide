import {getSnapIndex, SNAP_THRESHOLD_RATIO, VELOCITY_THRESHOLD} from './swipe';

describe('getSnapIndex', () => {
	/** The distance between adjacent snap positions — slideWidth + gap. */
	const stride = 300;
	const threshold = stride * SNAP_THRESHOLD_RATIO; /** 150px */

	it('stays at current index when delta is below distance and velocity thresholds', () => {
		expect(getSnapIndex(1, 4, -(threshold - 1), stride, 0)).toBe(1);
		expect(getSnapIndex(1, 4, threshold - 1, stride, 0)).toBe(1);
	});

	it('advances to next slide when swiped left past threshold', () => {
		expect(getSnapIndex(1, 4, -(threshold + 1), stride, 0)).toBe(2);
	});

	it('goes back to previous slide when swiped right past threshold', () => {
		expect(getSnapIndex(2, 4, threshold + 1, stride, 0)).toBe(1);
	});

	it('clamps at 0 — cannot go before first slide', () => {
		expect(getSnapIndex(0, 4, threshold + 1, stride, 0)).toBe(0);
	});

	it('clamps at maxIndex — cannot go beyond last scroll position', () => {
		expect(getSnapIndex(4, 4, -(threshold + 1), stride, 0)).toBe(4);
	});

	it('snaps forward on high velocity even with small delta', () => {
		const smallDelta = -(threshold - 50); /** below distance threshold */
		expect(
			getSnapIndex(1, 4, smallDelta, stride, -(VELOCITY_THRESHOLD + 0.1)),
		).toBe(2);
	});

	it('snaps backward on high velocity even with small delta', () => {
		const smallDelta = threshold - 50; /** below distance threshold */
		expect(
			getSnapIndex(2, 4, smallDelta, stride, VELOCITY_THRESHOLD + 0.1),
		).toBe(1);
	});

	it('returns currentIndex when stride is 0 (not yet measured)', () => {
		expect(getSnapIndex(2, 4, -500, 0, 1)).toBe(2);
	});

	describe('multi-slide drag', () => {
		it('advances by the number of slides dragged in one gesture', () => {
			/** 3 strides to the left from index 0 → land on slide 3, not 1. */
			expect(getSnapIndex(0, 4, -3 * stride, stride, 0)).toBe(3);
		});

		it('snaps to the nearest slide boundary', () => {
			/** 2.4 widths rounds to 2; 2.6 rounds to 3. */
			expect(getSnapIndex(0, 6, -2.4 * stride, stride, 0)).toBe(2);
			expect(getSnapIndex(0, 6, -2.6 * stride, stride, 0)).toBe(3);
		});

		it('goes back by several slides when dragged right across them', () => {
			expect(getSnapIndex(4, 4, 2 * stride, stride, 0)).toBe(2);
		});

		it('clamps a multi-slide drag at maxIndex', () => {
			expect(getSnapIndex(2, 4, -5 * stride, stride, 0)).toBe(4);
		});

		it('clamps a multi-slide drag at 0', () => {
			expect(getSnapIndex(2, 4, 5 * stride, stride, 0)).toBe(0);
		});

		it('moves several slides within bounds in loop mode', () => {
			expect(getSnapIndex(0, 9, -3 * stride, stride, 0, true)).toBe(3);
		});
	});

	describe('isLoop', () => {
		it('returns -1 at index 0 when swiped right past threshold (signals backward wrap)', () => {
			expect(getSnapIndex(0, 4, threshold + 1, stride, 0, true)).toBe(-1);
		});

		it('returns maxIndex+1 at maxIndex when swiped left past threshold (signals forward wrap)', () => {
			expect(getSnapIndex(4, 4, -(threshold + 1), stride, 0, true)).toBe(5);
		});

		it('advances normally when not at a boundary', () => {
			expect(getSnapIndex(2, 4, -(threshold + 1), stride, 0, true)).toBe(3);
		});
	});
});
