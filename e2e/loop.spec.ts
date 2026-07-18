import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX} from './support/gestures';

/**
 * #loop is a single loop carousel (5 slides, slidesPerView 1) with default arrows, pagination,
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

	/**
	 * Drag wraps exercise the full untrimmed path — getSnapIndex signalling an out-of-range
	 * index and the wrap dance through the real useTrackSnap — where the arrow tests above
	 * enter through navigateToIndex directly.
	 */
	test('dragging left past the last slide wraps to the first', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await c.dot(5).click();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');

		await dragX(page, c.root, -0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
		await expect(c.event(/4 → 0/).first()).toBeVisible();
	});

	test('dragging right before the first slide wraps to the last', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await dragX(page, c.root, 0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');
		await expect(c.event(/0 → 4/).first()).toBeVisible();
	});
});
