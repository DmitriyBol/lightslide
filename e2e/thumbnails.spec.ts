import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * #thumbnails renders the README synced-carousels recipe: a controlled main gallery (6 slides,
 * arrows) and a thumb strip that is a second LightSlide sharing the same index state. Only the
 * gallery mounts Navigation, so the section's arrow locators resolve to it; the thumbs are the
 * only buttons carrying the product names, reflecting selection through `aria-pressed`.
 */
test.describe('thumbnails recipe', () => {
	test('clicking a thumbnail drives the main gallery', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'thumbnails');
		const thumb = (name: RegExp) => c.section.getByRole('button', {name});

		await expect(thumb(/Air Runner/)).toHaveAttribute('aria-pressed', 'true');
		await expect(c.prev).toBeDisabled();

		/**
		 * Only a thumb that is actually on screen can be clicked: the strip shows 4.2 of 6 and
		 * its viewport clips rather than scrolls, so the last two start out of reach (a real
		 * user would drag). Stepping onto the fourth pulls the strip along — it shares the
		 * gallery's index — which brings the last thumb into view.
		 */
		await thumb(/Flip Pro/).click();
		await expect(thumb(/Flip Pro/)).toHaveAttribute('aria-pressed', 'true');

		/** Last thumb → the gallery lands on its final position, so next() has nowhere to go. */
		await thumb(/Flat Step/).click();
		await expect(thumb(/Flat Step/)).toHaveAttribute('aria-pressed', 'true');
		await expect(c.next).toBeDisabled();

		/**
		 * And backward: the strip is clamped to its end, so jump back onto a thumb that stayed
		 * visible — landing mid-range re-enables both arrows.
		 */
		await thumb(/Trail Boot/).click();
		await expect(thumb(/Trail Boot/)).toHaveAttribute('aria-pressed', 'true');
		await expect(c.prev).toBeEnabled();
		await expect(c.next).toBeEnabled();
	});

	test('gallery navigation moves the highlight onto the matching thumb', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'thumbnails');
		const thumb = (name: RegExp) => c.section.getByRole('button', {name});

		await c.next.click();
		await expect(thumb(/Urban Step/)).toHaveAttribute('aria-pressed', 'true');
		await expect(thumb(/Air Runner/)).toHaveAttribute('aria-pressed', 'false');
	});
});
