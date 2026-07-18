import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX, dragY} from './support/gestures';

/**
 * #vertical is a single axis="y" isLoop carousel (5 slides, slidesPerView 1, gap 12) with an
 * explicit 420px height, default arrows, pagination, a free-momentum toggle, and a <Console>
 * logging carousel_slide as "from → to (direction)". The axis only exists where logical pixels
 * meet physical ones, and jsdom has no layout — so everything here is e2e territory: slides
 * actually stacking, the arrows at the top/bottom edges, a vertical drag advancing, the
 * inverted direction lock releasing horizontal gestures to the page, and the loop/coast
 * running along Y.
 */
test.describe('vertical', () => {
	test('the arrows sit at the top and bottom edges, horizontally centred', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'vertical');
		await c.root.scrollIntoViewIfNeeded();

		const rootBox = await c.root.boundingBox();
		const prevBox = await c.prev.boundingBox();
		const nextBox = await c.next.boundingBox();
		if (!rootBox || !prevBox || !nextBox)
			throw new Error('carousel or nav buttons have no bounding box');
		expect(prevBox.y).toBeLessThan(nextBox.y);
		const rootCentre = rootBox.x + rootBox.width / 2;
		expect(Math.abs(prevBox.x + prevBox.width / 2 - rootCentre)).toBeLessThan(2);
		expect(Math.abs(nextBox.x + nextBox.width / 2 - rootCentre)).toBeLessThan(2);
	});

	/** Real slides carry the "N of M" group name; loop clones are aria-hidden and never match. */
	test('slides stack vertically and split the explicit height', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'vertical');
		await c.root.scrollIntoViewIfNeeded();

		const first = await c.section
			.getByRole('group', {name: '1 of 5'})
			.boundingBox();
		const second = await c.section
			.getByRole('group', {name: '2 of 5'})
			.boundingBox();
		if (!first || !second) throw new Error('slides have no bounding box');
		expect(second.y).toBeGreaterThan(first.y);
		expect(Math.abs(second.x - first.x)).toBeLessThan(1);
	});

	test('next moves the track down the axis and reports the visual direction "down"', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'vertical');

		await c.next.click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
		await expect(c.event(/0 → 1 \(down\)/).first()).toBeVisible();
	});

	test('dragging up past the threshold advances a slide', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'vertical');

		await dragY(page, c.root, -0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
		await expect(c.event(/0 → 1 \(down\)/).first()).toBeVisible();
	});

	test('dragging down from the first slide wraps backward to the last', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'vertical');

		await dragY(page, c.root, 0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');
		await expect(c.event(/0 → 4 \(up\)/).first()).toBeVisible();
	});

	test('a horizontal gesture is released to the page — the inverted direction lock', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'vertical');
		await c.root.scrollIntoViewIfNeeded();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');

		await dragX(page, c.root, -0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
	});

	/**
	 * The free coast integrates in logical space and only meets the axis at the transform, so
	 * an upward flick must coast forward along Y and wrap through the loop clones — rAF motion
	 * plus real layout, unreachable from jsdom.
	 */
	test('free momentum: an upward flick coasts forward and settles', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'vertical');
		await c.section.getByRole('switch', {name: /free momentum/}).click();

		await dragY(page, c.root, -0.5);

		await expect(c.activeDot).not.toHaveAccessibleName('Go to slide 1');
		await expect(c.event(/0 → \d/).first()).toBeVisible();
	});
});
