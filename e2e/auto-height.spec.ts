import type {Locator} from '@playwright/test';
import {expect, test} from '@playwright/test';

import type {Carousel} from './support/carousel';
import {carousel} from './support/carousel';

/**
 * #auto-height is a single carousel (5 slides of 120/220/140/280/170 px, slidesPerView 1,
 * gap 12) with the <AutoHeight /> plugin behind an on/off switch, default arrows and dots.
 * The plugin drives the real clipping box's height through a CSS transition — layout that
 * only exists in a browser, so the height tracking, the animation settling, and the
 * restore-on-unmount all live here.
 */
const HEIGHTS = [120, 220, 140, 280, 170];

/** slide → track → viewport: the clipping box whose inline height the plugin animates. */
function viewportOf(c: Carousel): Locator {
	return c.root
		.locator('[aria-roledescription="slide"]')
		.first()
		.locator('..')
		.locator('..');
}

test.describe('auto height', () => {
	test('the viewport tracks the active slide height through navigation', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'auto-height');
		const viewport = viewportOf(c);

		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(HEIGHTS[0]);

		await c.next.click();
		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(HEIGHTS[1]);

		await c.next.click();
		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(HEIGHTS[2]);

		await c.prev.click();
		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(HEIGHTS[1]);
	});

	test('switching the plugin off restores the tallest-slide box', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'auto-height');
		const viewport = viewportOf(c);

		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(HEIGHTS[0]);

		await c.section.getByRole('switch', {name: 'autoHeight'}).click();
		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(Math.max(...HEIGHTS));
	});

	/**
	 * NOTE: `test.use({reducedMotion: 'reduce'})` is silently ignored by the installed
	 * Playwright — the context never gets the emulation — so the page-level API is used
	 * instead (verified working). The trailing `matches` guard keeps the test honest: if the
	 * emulation ever stops applying, this fails on it rather than on a confusing transition.
	 */
	test('reduced motion applies heights instantly, with no transition', async ({
		page,
	}) => {
		await page.emulateMedia({reducedMotion: 'reduce'});
		await page.goto('/');
		const c = carousel(page, 'auto-height');
		const viewport = viewportOf(c);

		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(HEIGHTS[0]);

		await c.next.click();
		await expect
			.poll(() => viewport.evaluate(el => el.clientHeight))
			.toBe(HEIGHTS[1]);
		expect(
			await viewport.evaluate(el => ({
				transition: el.style.transition,
				matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
			})),
		).toEqual({transition: '', matches: true});
	});
});
