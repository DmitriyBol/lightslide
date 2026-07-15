import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * #loop is a single isLoop carousel (5 slides, slidesPerView 1) with default arrows, pagination,
 * and a <Console>. In loop mode the arrows never disable and the edges wrap around via cloned
 * slides — behaviour that only reads correctly with real layout.
 */
test.describe('loop mode', () => {
	test('arrows stay enabled; prev from the first slide wraps to the last', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await expect(c.prev).toBeEnabled();
		await expect(c.next).toBeEnabled();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');

		await c.prev.click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');
		await expect(c.event(/0 → 4/).first()).toBeVisible();
	});

	test('next from the last slide wraps back to the first', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await c.dot(5).click();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');

		await c.next.click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
		await expect(c.event(/4 → 0/).first()).toBeVisible();
	});
});
