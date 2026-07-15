import {createStore} from './store';
import {trackOffset} from './trackOffset';

/**
 * trackOffset is the single source of the track's translateX magnitude, shared by the snap
 * (useTrackSnap) and the live-drag base (useDragGesture). Its whole reason to exist is the
 * flush clamp that fixes a fractional slidesPerView cutting the last slide in half.
 */

describe('trackOffset', () => {
	describe('integer slidesPerView (clamp is a no-op)', () => {
		/** 6 slides, 2 per view, 300px each → maxIndex 4, max offset 1200px. */
		const store = createStore({
			slideCount: 6,
			slidesPerView: 2,
			slideWidth: 300,
		});

		it('returns visualIndex * slideWidth for every reachable index', () => {
			expect(trackOffset(0, store)).toBe(0);
			expect(trackOffset(3, store)).toBe(900);
			expect(trackOffset(4, store)).toBe(1200); /** last index, already flush */
		});
	});

	describe('fractional slidesPerView (the bug fix)', () => {
		/**
		 * 6 slides, 1.5 per view, 400px each. maxIndex = ceil(6 - 1.5) = 5.
		 * Flush max offset = (6 - 1.5) * 400 = 1800px.
		 */
		const store = createStore({
			slideCount: 6,
			slidesPerView: 1.5,
			slideWidth: 400,
		});

		it('leaves intermediate indices on their slide boundary', () => {
			expect(trackOffset(0, store)).toBe(0);
			expect(trackOffset(4, store)).toBe(1600);
		});

		it('clamps the final index to the flush right edge instead of over-translating', () => {
			/**
			 * Unclamped this would be 5 * 400 = 2000 and the last slide would sit half
			 * off-screen; clamped it lands at 1800 so slide 6 is fully visible.
			 */
			expect(trackOffset(5, store)).toBe(1800);
		});
	});

	describe('loop mode never clamps', () => {
		/** Clones own the wrap-around, so synthetic indices past the end must translate linearly. */
		const store = createStore({
			slideCount: 6,
			slidesPerView: 1.5,
			slideWidth: 400,
			isLoop: true,
			loopOffset: 2,
		});

		it('returns the raw linear offset for clone indices', () => {
			expect(trackOffset(5, store)).toBe(2000);
			expect(trackOffset(8, store)).toBe(3200);
		});
	});

	describe('gap (positions step by slideWidth + gap)', () => {
		it('offsets every index by the stride, clamp still a no-op for an integer view', () => {
			/** 6 slides, 2 per view, 300px + 20px gap → stride 320, max offset (4·300)+(4·20)=1280. */
			const store = createStore({
				slideCount: 6,
				slidesPerView: 2,
				slideWidth: 300,
				gap: 20,
			});
			expect(trackOffset(1, store)).toBe(320);
			expect(trackOffset(4, store)).toBe(1280);
		});

		it('clamps the fractional final index flush, gaps included', () => {
			/**
			 * 6 slides, 1.5 per view, 400px + 20px gap. Content = 6·400 + 5·20 = 2500;
			 * viewport = 1.5·400 + 1·20 = 620 → flush max offset 1880 (raw would be 5·420 = 2100).
			 */
			const store = createStore({
				slideCount: 6,
				slidesPerView: 1.5,
				slideWidth: 400,
				gap: 20,
			});
			expect(trackOffset(4, store)).toBe(1680);
			expect(trackOffset(5, store)).toBe(1880);
		});

		it('keeps clone indices linear in loop mode', () => {
			const store = createStore({
				slideCount: 6,
				slidesPerView: 1.5,
				slideWidth: 400,
				gap: 20,
				isLoop: true,
				loopOffset: 2,
			});
			expect(trackOffset(5, store)).toBe(2100);
			expect(trackOffset(8, store)).toBe(3360);
		});
	});

	it('pins the offset at 0 when every slide already fits', () => {
		const fits = createStore({slideCount: 3, slidesPerView: 3, slideWidth: 200});
		expect(trackOffset(1, fits)).toBe(0);

		const overflowsView = createStore({
			slideCount: 2,
			slidesPerView: 3,
			slideWidth: 200,
		});
		expect(trackOffset(1, overflowsView)).toBe(0);
	});
});
