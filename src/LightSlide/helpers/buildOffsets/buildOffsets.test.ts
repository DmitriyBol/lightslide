import {buildSlideOffsets, measuredMaxIndex} from './buildOffsets';

/**
 * The measuring half of variable-width geometry. buildSlideOffsets is the array the reading
 * helpers index; measuredMaxIndex is the reachable-position count that replaces
 * ceil(count - spv). Both must reduce to the uniform-width numbers so fixed mode stays exact.
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
