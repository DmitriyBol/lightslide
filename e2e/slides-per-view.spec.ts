import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * #slides-per-view: 6 slides, no nav/pagination — Segmented controls set slidesPerView and gap,
 * and a readout shows the derived maxIndex. The library splits the viewport into slidesPerView
 * columns and spaces them with a real CSS column-gap — layout-measured behaviours jsdom can't
 * see (slideWidth there is always 0).
 */
test.describe('slidesPerView', () => {
	test('slide width scales as slidesPerView changes', async ({page}) => {
		await page.goto('/');
		const section = page.locator('#slides-per-view');
		const c = carousel(page, 'slides-per-view');
		const tile = c.card('Air Runner');

		await section.scrollIntoViewIfNeeded();
		/** Default slidesPerView is 1.5 → fractional, maxIndex = ceil(6 - 1.5) = 5. */
		await expect(section.getByText(/maxIndex 5/)).toBeVisible();
		const wide = await tile.boundingBox();
		if (!wide) throw new Error('tile has no bounding box');

		/**
		 * Switch to 3 columns. The readout confirms the re-render committed; poll the width so we
		 * don't race the layout-effect re-measure.
		 */
		await section.getByRole('button', {name: '3', exact: true}).click();
		await expect(section.getByText(/maxIndex 3/)).toBeVisible();

		/** 3 columns vs 1.5 ≈ half the width; assert a clear, well-above-noise shrink. */
		await expect
			.poll(async () => (await tile.boundingBox())?.width ?? 0)
			.toBeLessThan(wide.width * 0.7);
	});

	test('gap spaces adjacent slides by exactly the configured px', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#slides-per-view');
		const c = carousel(page, 'slides-per-view');

		await section.scrollIntoViewIfNeeded();
		/** Turn the 24px gap on; the tag readout confirms the re-render committed. */
		await section.getByRole('button', {name: '24', exact: true}).click();
		await expect(section.getByText(/gap=24px/)).toBeVisible();

		/** Poll so we don't race the layout-effect re-measure after the gap change. */
		await expect
			.poll(async () => {
				const first = await c.card('Air Runner').boundingBox();
				const second = await c.card('Urban Step').boundingBox();
				if (!first || !second) return -1;
				return second.x - (first.x + first.width);
			})
			.toBeCloseTo(24, 0);
	});
});
