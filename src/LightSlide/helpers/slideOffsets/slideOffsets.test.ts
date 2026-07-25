import {buildSlideOffsets} from '../buildOffsets/buildOffsets';
import {createStore} from '../store';
import {contentSpan, loopHome, nearestVisualIndex} from './slideOffsets';

/**
 * The reading half of variable-width geometry: the snap lookup and the loop's home/span, both
 * of which must reduce to the uniform-width numbers so the fixed-mode path stays exact.
 */

describe('nearestVisualIndex', () => {
	const offsets = [0, 100, 400, 600];

	it('returns the exact index when the target lands on a boundary', () => {
		expect(nearestVisualIndex(offsets, 0)).toBe(0);
		expect(nearestVisualIndex(offsets, 100)).toBe(1);
		expect(nearestVisualIndex(offsets, 400)).toBe(2);
	});

	it('rounds to the nearer of the two surrounding boundaries', () => {
		/** 60 is nearer 100 than 0 → index 1; 240 is nearer 100 than 400 → index 1. */
		expect(nearestVisualIndex(offsets, 60)).toBe(1);
		expect(nearestVisualIndex(offsets, 240)).toBe(1);
		expect(nearestVisualIndex(offsets, 260)).toBe(2);
	});

	it('breaks a tie toward the earlier slide', () => {
		/** 50 is equidistant from 0 and 100 → earlier boundary 0. */
		expect(nearestVisualIndex(offsets, 50)).toBe(0);
		expect(nearestVisualIndex(offsets, 250)).toBe(1);
	});

	it('pins targets past either end to the first/last edge', () => {
		expect(nearestVisualIndex(offsets, -40)).toBe(0);
		expect(nearestVisualIndex(offsets, 9999)).toBe(3);
	});
});

describe('loopHome / contentSpan', () => {
	it('fall back to the uniform stride when widths are fixed', () => {
		/** 5 slides of 300 + gap 20 → stride 320; home = 2 clones in, span = one full strip. */
		const store = createStore({
			slideCount: 5,
			slideWidth: 300,
			gap: 20,
			loopOffset: 2,
			isLoop: true,
		});
		expect(loopHome(store)).toBe(640);
		expect(contentSpan(store)).toBe(1600);
	});

	it('read the measured edges with variable widths', () => {
		/**
		 * 3 slides of 100/300/200 cloned on both sides (auto duplicates the whole strip), no
		 * gap: home is the first real slide's edge (600) and the span is one strip (600).
		 */
		const store = createStore({
			slideCount: 3,
			loopOffset: 3,
			isLoop: true,
			slideOffsets: buildSlideOffsets(
				[100, 300, 200, 100, 300, 200, 100, 300, 200],
				0,
			),
		});
		expect(loopHome(store)).toBe(600);
		expect(contentSpan(store)).toBe(600);
	});
});
