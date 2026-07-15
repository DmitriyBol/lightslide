import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/** First carousel in #pagination: 5 slides, slidesPerView 1 → 5 dots (maxIndex + 1). */
test.describe('pagination dots', () => {
	test('one dot per scroll position, first dot active', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'pagination');

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
		await expect(c.dot(5)).toBeVisible();
		/** No 6th position anywhere in the section (the second carousel only reaches 4). */
		await expect(
			page.locator('#pagination').getByRole('button', {name: 'Go to slide 6'}),
		).toHaveCount(0);
	});

	test('clicking a dot jumps to that slide and logs analytics', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'pagination');

		await c.dot(3).click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 3');
		/** Both the pagination and the slide event log this transition, so match the first row. */
		await expect(c.event(/0 → 2/).first()).toBeVisible();
	});
});
