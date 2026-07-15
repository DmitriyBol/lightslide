import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * #breakpoints: 6 slides, base slidesPerView 1.2 / gap 8, overridden to 2 / 16 from 720px
 * and 3 / 24 from 1080px. The demo's readout mirrors the matched query, so each assertion
 * first waits for the flip to commit and then measures the real layout — the part jsdom
 * can't see. Viewport resizes drive the media queries themselves; no demo controls exist
 * here.
 */
test.describe('breakpoints', () => {
	test('slidesPerView and gap follow the viewport across breakpoints', async ({
		page,
	}) => {
		await page.setViewportSize({width: 1280, height: 800});
		await page.goto('/');
		const section = page.locator('#breakpoints');
		const c = carousel(page, 'breakpoints');
		await section.scrollIntoViewIfNeeded();

		await expect(section.getByText(/≥1080px/)).toBeVisible();
		const measureGap = async () => {
			const first = await c.card('Air Runner').boundingBox();
			const second = await c.card('Urban Step').boundingBox();
			if (!first || !second) return -1;
			return second.x - (first.x + first.width);
		};
		await expect.poll(measureGap).toBeCloseTo(24, 0);
		const wide = await c.card('Air Runner').boundingBox();
		if (!wide) throw new Error('tile has no bounding box');

		/** Mid breakpoint: 2 per view with a 16px gap. */
		await page.setViewportSize({width: 900, height: 800});
		await expect(section.getByText(/≥720px/)).toBeVisible();
		await expect.poll(measureGap).toBeCloseTo(16, 0);

		/**
		 * Base props below 720px: 1.2 per view — the slide claims most of a now much narrower
		 * viewport, so its absolute width still clearly exceeds a third of the 1280px well.
		 */
		await page.setViewportSize({width: 600, height: 800});
		await expect(section.getByText(/base →/)).toBeVisible();
		await expect.poll(measureGap).toBeCloseTo(8, 0);
		await expect
			.poll(async () => (await c.card('Air Runner').boundingBox())?.width ?? 0)
			.toBeGreaterThan(wide.width * 1.2);
	});
});
