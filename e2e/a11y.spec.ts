import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * The #a11y section: one labelled carousel, 5 slides, slidesPerView 1 → maxIndex 4, with the
 * opt-in <A11y /> layer (keyboard + focus-guard + live region + reduced-motion). These specs cover
 * what jsdom can't verify in a real browser: actual keyboard focus flow and the `inert` attribute.
 * Off-screen slides are `inert`, which can drop them from the a11y tree, so slides are addressed by
 * their aria-label attribute rather than by role.
 */
test.describe('accessibility layer', () => {
	test('exposes a labelled carousel region with per-slide groups', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#a11y');

		const region = section.getByRole('region', {name: 'Product highlights'});
		await expect(region).toHaveAttribute('aria-roledescription', 'carousel');

		/** Every real slide is a labelled "N of M" group. */
		await expect(section.locator('[aria-label="1 of 5"]')).toBeAttached();
		await expect(section.locator('[aria-label="5 of 5"]')).toHaveAttribute(
			'aria-roledescription',
			'slide',
		);
	});

	test('nav buttons and dots point aria-controls at the slides container', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'a11y');

		const controls = await c.next.getAttribute('aria-controls');
		expect(controls).toBeTruthy();
		/**
		 * useId ids contain colons (e.g. ":r13:") — valid HTML ids but invalid in a `#id` CSS
		 * selector, so match on the attribute instead.
		 */
		await expect(c.section.locator(`[id="${controls}"]`)).toBeAttached();
		await expect(c.dot(1)).toHaveAttribute('aria-controls', String(controls));
	});

	test('arrow keys navigate once a control has focus', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'a11y');

		await expect(c.activeDot).toHaveAttribute('aria-label', 'Go to slide 1');

		/**
		 * Focus a pagination dot (dots never disable, so focus survives every hop) and drive with
		 * the keyboard. Focusing alone doesn't navigate — only the key presses do.
		 */
		await c.dot(1).focus();

		await page.keyboard.press('ArrowRight');
		await expect(c.activeDot).toHaveAttribute('aria-label', 'Go to slide 2');
		await expect(c.event(/0 → 1/).first()).toBeVisible();

		await page.keyboard.press('End');
		await expect(c.activeDot).toHaveAttribute('aria-label', 'Go to slide 5');

		await page.keyboard.press('Home');
		await expect(c.activeDot).toHaveAttribute('aria-label', 'Go to slide 1');
	});

	test('off-screen slides are inert so focus cannot land on them', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#a11y');

		/** At index 0 the current slide is interactive and the next one is guarded. */
		await expect(section.locator('[aria-label="1 of 5"]')).not.toHaveAttribute(
			'inert',
			'',
		);
		await expect(section.locator('[aria-label="2 of 5"]')).toHaveAttribute(
			'inert',
			'',
		);
	});
});
