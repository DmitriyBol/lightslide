import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {edge, scrollToRest, waitForRest} from './support/motion';

/**
 * First carousel in #wheel: 5 slides, slidesPerView 1, wheel + pagination. page.mouse.wheel
 * emits trusted wheel events at the current cursor position, so hovering the carousel root
 * first routes them into the plugin's listener. One 120 px flick is well past the 30 px
 * accumulate threshold — a single page turn per gesture. The wheel has no actionability wait
 * of its own: the section must have finished scrolling into place before the cursor is aimed,
 * or the flick lands beside the carousel and silently scrolls the page instead.
 */
test.describe('wheel gestures', () => {
	test('a horizontal wheel flick pages the carousel', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'wheel');
		await scrollToRest(c.root);
		await c.root.hover();

		await page.mouse.wheel(120, 0);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
	});

	test('a second flick after the gesture settles pages again, and back', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'wheel');
		await scrollToRest(c.root);
		await c.root.hover();

		await page.mouse.wheel(120, 0);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');

		/**
		 * WHEEL_RESET_MS (150) of silence ends the first gesture and re-arms the accumulator.
		 * The wait starts only once the page has handled the first flick, so however loaded the
		 * machine, the two flicks reach the page at least this far apart.
		 */
		await page.waitForTimeout(250);
		await page.mouse.wheel(120, 0);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 3');

		await page.waitForTimeout(250);
		await page.mouse.wheel(-120, 0);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
	});

	test('a horizontal flick drifts the flow strip instead of paging', async ({
		page,
	}) => {
		await page.goto('/');
		/** Second carousel in #wheel: a flow ticker with the wheel plugin mounted. */
		const c = carousel(page, 'wheel', 1);
		await scrollToRest(c.root);
		/** Hovering pauses the drift (pauseOnHover), so the only motion left is the wheel's. */
		await c.root.hover();

		const chip = c.section.getByText('Inertia-aware', {exact: true}).first();
		/** The page may register the hover a frame late — measure from where the drift stopped. */
		const before = await waitForRest(edge(chip));

		await page.mouse.wheel(120, 0);

		/** offset += 120 → the strip moves left by the wheel delta on the next frame. */
		await expect
			.poll(async () => before - (await edge(chip)()))
			.toBeGreaterThan(80);
	});

	test('vertical scrolling over the carousel scrolls the page, not the carousel', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'wheel');
		await scrollToRest(c.root);
		await c.root.hover();

		const before = await page.evaluate(() => window.scrollY);
		await page.mouse.wheel(0, 400);

		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(before);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
	});
});
