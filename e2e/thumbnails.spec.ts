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

		/** Last thumb → the gallery lands on its final position, so next() has nowhere to go. */
		await thumb(/Flat Step/).click();
		await expect(thumb(/Flat Step/)).toHaveAttribute('aria-pressed', 'true');
		await expect(c.next).toBeDisabled();

		/**
		 * And backward: with the strip now clamped to its end, the first thumb sits clipped
		 * behind the viewport's overflow (a real user would drag first), so jump back onto a
		 * thumb that stayed visible — landing mid-range re-enables both arrows.
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
