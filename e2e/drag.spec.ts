import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX} from './support/gestures';

/**
 * #basic is a single slidesPerView=1 carousel that logs carousel_slide to its <Console>. Real
 * pointer drag here is the headline thing the jsdom integration tests can't exercise: in jsdom
 * slideWidth is 0, so the snap decision never runs. The library snaps when the drag passes 50% of
 * the slide width OR the flick velocity passes 0.3 px/ms (see utils/swipe.ts).
 */
test.describe('drag gesture', () => {
	test('dragging left past the threshold advances a slide', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'basic');

		/** 60% of the slide width, fast — comfortably over the distance threshold. */
		await dragX(page, c.card('Air Runner Pro'), -0.6);

		await expect(c.event(/0 → 1/)).toBeVisible();
	});

	test('a small, slow drag snaps back without changing slide', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'basic');

		/**
		 * 15% of the slide width, slow — under both the distance and the velocity thresholds, so it
		 * rubber-bands back to slide 0 and fires no carousel_slide.
		 */
		await dragX(page, c.card('Air Runner Pro'), -0.15, {steps: 10, delayMs: 60});

		await expect(c.event(/0 → 1/)).toHaveCount(0);
	});
});
