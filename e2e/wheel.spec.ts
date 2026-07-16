import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * First carousel in #wheel: 5 slides, slidesPerView 1, wheel + pagination. page.mouse.wheel
 * emits trusted wheel events at the current cursor position, so hovering the carousel root
 * first routes them into the plugin's listener. One 120 px flick is well past the 30 px
 * accumulate threshold — a single page turn per gesture.
 */
test.describe('wheel gestures', () => {
	test('a horizontal wheel flick pages the carousel', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'wheel');
		await c.root.scrollIntoViewIfNeeded();
		await c.root.hover();

		await page.mouse.wheel(120, 0);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
	});

	test('a second flick after the gesture settles pages again, and back', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'wheel');
		await c.root.scrollIntoViewIfNeeded();

		/**
		 * Re-hover before every flick: the playground's reveal-on-scroll animation shifts the
		 * section up 12 px after it enters the viewport, so a once-hovered point can end up
		 * outside the carousel. hover() waits for the box to be stable before positioning.
		 */
		await c.root.hover();
		await page.mouse.wheel(120, 0);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');

		/** WHEEL_RESET_MS of silence ends the first gesture and re-arms the accumulator. */
		await page.waitForTimeout(250);
		await c.root.hover();
		await page.mouse.wheel(120, 0);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 3');

		await page.waitForTimeout(250);
		await c.root.hover();
		await page.mouse.wheel(-120, 0);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
	});

	test('a horizontal flick drifts the flow strip instead of paging', async ({
		page,
	}) => {
		await page.goto('/');
		/** Second carousel in #wheel: a flow ticker with the wheel plugin mounted. */
		const c = carousel(page, 'wheel', 1);
		await c.root.scrollIntoViewIfNeeded();
		/** Hovering pauses the drift (pauseOnHover), so the only motion left is the wheel's. */
		await c.root.hover();

		const chip = c.section.getByText('Inertia-aware', {exact: true}).first();
		const before = await chip.boundingBox();
		if (!before) throw new Error('flow chip has no bounding box');

		await page.mouse.wheel(120, 0);

		/** offset += 120 → the strip moves left by the wheel delta on the next frame. */
		await expect
			.poll(async () => {
				const after = await chip.boundingBox();
				return after ? before.x - after.x : 0;
			})
			.toBeGreaterThan(80);
	});

	test('vertical scrolling over the carousel scrolls the page, not the carousel', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'wheel');
		await c.root.scrollIntoViewIfNeeded();
		await c.root.hover();

		const before = await page.evaluate(() => window.scrollY);
		await page.mouse.wheel(0, 400);

		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(before);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
	});
});
