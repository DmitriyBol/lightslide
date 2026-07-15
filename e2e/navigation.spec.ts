import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * First carousel in #navigation: default arrows, 5 slides, slidesPerView 1 → maxIndex 4. Both
 * carousels in the section share one <Console>, so the logged rows below come from this one.
 */
test.describe('navigation arrows', () => {
	test('prev is disabled at the start; next advances and logs analytics', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'navigation');

		await expect(c.prev).toBeDisabled();

		await c.next.click();
		/** Both the nav-button and the slide event log this transition, so match the first row. */
		await expect(c.event(/0 → 1/).first()).toBeVisible();
		await expect(c.prev).toBeEnabled();
	});

	test('next disables once the last slide is reached', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'navigation');

		for (let i = 0; i < 4; i++) await c.next.click();

		await expect(c.next).toBeDisabled();
		await expect(c.event(/3 → 4/).first()).toBeVisible();
	});
});
