import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX} from './support/gestures';

/**
 * #rtl is a single dir="rtl" loop carousel (5 slides, slidesPerView 1) with default arrows,
 * pagination, and a <Console> logging carousel_slide as "from → to (direction)". RTL is a sign,
 * not a mirror, in the library's math — but only real layout shows the sign meeting the
 * browser-mirrored flex track, so everything here is e2e territory: mirrored button placement,
 * a rightward drag advancing, the wrap running the other way, and the analytics direction
 * staying the visual truth (forward = left).
 */
test.describe('rtl', () => {
	test('the arrows swap sides: prev sits right of next', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'rtl');
		await c.root.scrollIntoViewIfNeeded();

		const prevBox = await c.prev.boundingBox();
		const nextBox = await c.next.boundingBox();
		if (!prevBox || !nextBox) throw new Error('nav buttons have no bounding box');
		expect(prevBox.x).toBeGreaterThan(nextBox.x);
	});

	test('next advances leftward and reports the visual direction "left"', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'rtl');

		await c.next.click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
		await expect(c.event(/0 → 1 \(left\)/).first()).toBeVisible();
	});

	test('dragging right past the threshold advances a slide', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'rtl');

		/** The mirror of the ltr advance: in rtl the next slide sits to the LEFT, so drag right. */
		await dragX(page, c.root, 0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
		await expect(c.event(/0 → 1/).first()).toBeVisible();
	});

	test('dragging left from the first slide wraps backward to the last', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'rtl');

		await dragX(page, c.root, -0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');
		await expect(c.event(/0 → 4/).first()).toBeVisible();
	});

	test('next from the last slide wraps forward to the first', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'rtl');

		await c.dot(5).click();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');

		await c.next.click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
		await expect(c.event(/4 → 0 \(left\)/).first()).toBeVisible();
	});

	/**
	 * The free coast integrates in logical space and only meets the direction at the transform,
	 * so an rtl flick must coast mirrored and wrap seamlessly through the loop clones — the one
	 * combination the unit tests cannot see (jsdom has no layout, the coast is rAF-driven).
	 */
	test('free momentum: a rightward flick coasts forward and settles', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'rtl');
		await c.section
			.getByRole('switch', {name: /free momentum/})
			.click();

		await dragX(page, c.root, 0.5);

		await expect(c.activeDot).not.toHaveAccessibleName('Go to slide 1');
		await expect(c.event(/0 → \d/).first()).toBeVisible();
	});

	test('free momentum: a leftward flick from the first slide wraps backward', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'rtl');
		await c.section
			.getByRole('switch', {name: /free momentum/})
			.click();

		await dragX(page, c.root, -0.5);

		await expect(c.activeDot).toHaveAccessibleName(/Go to slide [345]/);
	});
});
