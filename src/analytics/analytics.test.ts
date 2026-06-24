import {
	buildInViewportPayload,
	buildNavButtonPayload,
	buildPaginationClickPayload,
	buildReachedEndPayload,
	buildSlidePayload,
	buildViewedSlidesPayload,
} from './analytics';

describe('payload builders', () => {
	it('buildInViewportPayload returns correct shape', () => {
		expect(buildInViewportPayload()).toEqual({
			event: 'carousel_in_viewport',
		});
	});

	it('buildSlidePayload returns correct shape', () => {
		expect(buildSlidePayload('right', 0, 1)).toEqual({
			event: 'carousel_slide',
			direction: 'right',
			fromIndex: 0,
			toIndex: 1,
		});
	});

	it('buildReachedEndPayload includes all slides', () => {
		const slides = [
			{index: 0, data: {id: 1}},
			{index: 1, data: {id: 2}},
		];
		const p = buildReachedEndPayload(slides);
		expect(p.event).toBe('carousel_reached_end');
		expect(p.slides).toHaveLength(2);
	});

	it('buildViewedSlidesPayload includes slides and elapsed time', () => {
		const p = buildViewedSlidesPayload([{index: 0, data: null}], 30);
		expect(p.event).toBe('carousel_viewed_slides');
		expect(p.viewedSeconds).toBe(30);
		expect(p.slides).toHaveLength(1);
	});

	it('buildNavButtonPayload returns correct shape', () => {
		expect(buildNavButtonPayload('right', 1, 2)).toEqual({
			event: 'carousel_nav_button',
			direction: 'right',
			fromIndex: 1,
			toIndex: 2,
		});
	});

	it('buildPaginationClickPayload returns correct shape', () => {
		expect(buildPaginationClickPayload(0, 3)).toEqual({
			event: 'carousel_pagination_click',
			fromIndex: 0,
			toIndex: 3,
		});
	});
});
