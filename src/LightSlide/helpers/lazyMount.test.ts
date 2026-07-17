import {buildMountPredicate} from './lazyMount';

/**
 * Positional-arg wrapper so each case reads by name, plus a compact whole-window
 * assertion: the mounted logical indices for the given geometry.
 */
function mountedIndices(window: {
	currentIndex: number;
	slideCount: number;
	slidesPerView: number;
	maxIndex: number;
	isLoop: boolean;
	margin: number;
	centered?: boolean;
}): number[] {
	const predicate = buildMountPredicate(
		window.currentIndex,
		window.slideCount,
		window.slidesPerView,
		window.maxIndex,
		window.isLoop,
		window.margin,
		window.centered ?? false,
	);
	return Array.from({length: window.slideCount}, (_, i) => i).filter(predicate);
}

describe('buildMountPredicate', () => {
	it('mounts the visible slide plus margin on each side', () => {
		expect(
			mountedIndices({
				currentIndex: 5,
				slideCount: 10,
				slidesPerView: 1,
				maxIndex: 9,
				isLoop: false,
				margin: 1,
			}),
		).toEqual([4, 5, 6]);
	});

	it('mounts only the visible window with margin 0', () => {
		expect(
			mountedIndices({
				currentIndex: 5,
				slideCount: 10,
				slidesPerView: 2,
				maxIndex: 8,
				isLoop: false,
				margin: 0,
			}),
		).toEqual([5, 6]);
	});

	it('clamps the window at the first slide', () => {
		expect(
			mountedIndices({
				currentIndex: 0,
				slideCount: 10,
				slidesPerView: 1,
				maxIndex: 9,
				isLoop: false,
				margin: 2,
			}),
		).toEqual([0, 1, 2]);
	});

	it('covers the flush-clamped partial slide at maxIndex with a fractional slidesPerView', () => {
		/**
		 * count 5, spv 2.5 → maxIndex ceil(2.5) = 3; the flush clamp shows the last 2.5
		 * slides, so slide 2 is half-visible and must mount even with margin 0.
		 */
		expect(
			mountedIndices({
				currentIndex: 3,
				slideCount: 5,
				slidesPerView: 2.5,
				maxIndex: 3,
				isLoop: false,
				margin: 0,
			}),
		).toEqual([2, 3, 4]);
	});

	it('does not widen the window at maxIndex with an integer slidesPerView', () => {
		expect(
			mountedIndices({
				currentIndex: 3,
				slideCount: 5,
				slidesPerView: 2,
				maxIndex: 3,
				isLoop: false,
				margin: 0,
			}),
		).toEqual([3, 4]);
	});

	it('mounts every slide when slidesPerView exceeds the slide count', () => {
		expect(
			mountedIndices({
				currentIndex: 0,
				slideCount: 2,
				slidesPerView: 3,
				maxIndex: 0,
				isLoop: false,
				margin: 0,
			}),
		).toEqual([0, 1]);
	});

	it('wraps the window across the loop seam at the start', () => {
		expect(
			mountedIndices({
				currentIndex: 0,
				slideCount: 6,
				slidesPerView: 1,
				maxIndex: 5,
				isLoop: true,
				margin: 1,
			}),
		).toEqual([0, 1, 5]);
	});

	it('wraps the window across the loop seam at the end', () => {
		expect(
			mountedIndices({
				currentIndex: 5,
				slideCount: 6,
				slidesPerView: 1,
				maxIndex: 5,
				isLoop: true,
				margin: 1,
			}),
		).toEqual([0, 4, 5]);
	});

	it('extends the window left for the centred peek', () => {
		/** centered at spv 1.5: the inset exposes slide 4 left of the active 5, even at margin 0 */
		expect(
			mountedIndices({
				currentIndex: 5,
				slideCount: 10,
				slidesPerView: 1.5,
				maxIndex: 9,
				isLoop: false,
				margin: 0,
				centered: true,
			}),
		).toEqual([4, 5, 6]);
	});

	it('grows the centred lead with slidesPerView', () => {
		/** spv 4 centred → centerLead ceil(3/2) = 2 slides peek left of the active one */
		expect(
			mountedIndices({
				currentIndex: 5,
				slideCount: 12,
				slidesPerView: 4,
				maxIndex: 8,
				isLoop: false,
				margin: 0,
				centered: true,
			}),
		).toEqual([3, 4, 5, 6, 7, 8]);
	});

	it('wraps the centred lead across the loop seam', () => {
		/** centered loop at index 0: the left peek is the last slide's clone → slide 5 mounts */
		expect(
			mountedIndices({
				currentIndex: 0,
				slideCount: 6,
				slidesPerView: 1.5,
				maxIndex: 5,
				isLoop: true,
				margin: 0,
				centered: true,
			}),
		).toEqual([0, 1, 5]);
	});

	it('mounts every slide when the loop window covers the whole strip', () => {
		expect(
			mountedIndices({
				currentIndex: 1,
				slideCount: 4,
				slidesPerView: 2,
				maxIndex: 2,
				isLoop: true,
				margin: 1,
			}),
		).toEqual([0, 1, 2, 3]);
	});
});
