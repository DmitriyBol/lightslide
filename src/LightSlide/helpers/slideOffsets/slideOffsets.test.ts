import {
	buildSlideOffsets,
	measuredMaxIndex,
	nearestVisualIndex,
} from './slideOffsets';

/**
 * The pure geometry behind variable-width mode. buildSlideOffsets is the array trackOffset
 * indexes; measuredMaxIndex is the reachable-position count that replaces ceil(count − spv).
 * Both must reduce to the uniform-width numbers so the fixed-mode path stays exact.
 */

describe('buildSlideOffsets', () => {
	it('accumulates leading edges with no gap', () => {
		expect(buildSlideOffsets([100, 300, 200], 0)).toEqual([0, 100, 400, 600]);
	});

	it('folds the gap into every step, including a trailing one on the last entry', () => {
		expect(buildSlideOffsets([100, 300, 200], 20)).toEqual([0, 120, 440, 660]);
	});

	it('matches the uniform stride when every slide is the same size', () => {
		/** 4 slides of 250 + gap 10 → each entry is i × (250 + 10), the fixed-mode stride. */
		expect(buildSlideOffsets([250, 250, 250, 250], 10)).toEqual([
			0, 260, 520, 780, 1040,
		]);
	});

	it('returns just the origin for an empty strip', () => {
		expect(buildSlideOffsets([], 0)).toEqual([0]);
	});
});

describe('measuredMaxIndex', () => {
	it('stops at the first slide that rests flush against the right edge', () => {
		/** Sizes 100/300/200, content 600, viewport 400 → max offset 200; slide 2 (edge 400) is flush. */
		const offsets = buildSlideOffsets([100, 300, 200], 0);
		expect(measuredMaxIndex(offsets, 0, 400)).toBe(2);
	});

	it('collapses trailing slides that share the final viewport into one position', () => {
		/** A wide lead then two narrow slides that fit together last → max index 1, not 2. */
		const offsets = buildSlideOffsets([400, 100, 100], 0);
		expect(measuredMaxIndex(offsets, 0, 400)).toBe(1);
	});

	it('is 0 when the whole strip fits the viewport', () => {
		const offsets = buildSlideOffsets([100, 100], 0);
		expect(measuredMaxIndex(offsets, 0, 400)).toBe(0);
	});

	it('accounts for the gap when measuring the content width', () => {
		/** Sizes 200/200/200 + gap 20 → content 640, viewport 400, max offset 240; edge 220 < 240, 440 ≥ 240. */
		const offsets = buildSlideOffsets([200, 200, 200], 20);
		expect(measuredMaxIndex(offsets, 20, 400)).toBe(2);
	});
});

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
