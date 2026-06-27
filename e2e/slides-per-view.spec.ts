import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

// #slides-per-view: 6 slides, no nav/pagination — a Segmented control sets slidesPerView and a
// readout shows the derived maxIndex. The library splits the viewport into slidesPerView columns,
// so each rendered slide's width scales with the setting — a layout-measured behaviour jsdom can't
// see (slideWidth there is always 0).
test.describe('slidesPerView', () => {
	test('slide width scales as slidesPerView changes', async ({page}) => {
		await page.goto('/');
		const section = page.locator('#slides-per-view');
		const c = carousel(page, 'slides-per-view');
		const tile = c.card('Air Runner');

		await section.scrollIntoViewIfNeeded();
		// Default slidesPerView is 1.5 → fractional, maxIndex = ceil(6 - 1.5) = 5.
		await expect(section.getByText(/maxIndex 5/)).toBeVisible();
		const wide = await tile.boundingBox();
		if (!wide) throw new Error('tile has no bounding box');

		// Switch to 3 columns. The readout confirms the re-render committed; poll the width so we
		// don't race the layout-effect re-measure.
		await section.getByRole('button', {name: '3', exact: true}).click();
		await expect(section.getByText(/maxIndex 3/)).toBeVisible();

		// 3 columns vs 1.5 ≈ half the width; assert a clear, well-above-noise shrink.
		await expect
			.poll(async () => (await tile.boundingBox())?.width ?? 0)
			.toBeLessThan(wide.width * 0.7);
	});
});
