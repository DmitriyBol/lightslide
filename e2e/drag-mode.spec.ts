import type {Locator} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX} from './support/gestures';

/**
 * #drag-mode is a slidesPerView=2.5, gap=12 carousel whose Segmented toggles dragMode
 * (default 'free'). Momentum physics is pure browser territory: jsdom has no rAF layout and
 * no measured transforms, so the coast, its settle commit, and the free-snap boundary landing
 * can only be asserted here. The track transform is read the same way the flow spec does —
 * the translateX px of the [id] track element.
 */
test.describe('dragMode', () => {
	const trackX = async (track: Locator): Promise<number> => {
		const s = await track.evaluate(el => el.style.transform);
		return Number(/-?[\d.]+/.exec(s)?.[0] ?? NaN);
	};

	test('free: the track coasts on after release and commits a settle', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'drag-mode');
		await c.root.scrollIntoViewIfNeeded();
		const track = c.root.locator('[id]');

		/** A fast flick — few steps, no delay — so real momentum is left at release. */
		await dragX(page, c.card('Momentum'), -0.9, {steps: 4});
		const atRelease = await trackX(track);

		/** The coast keeps moving the track after the pointer is gone. */
		await expect(async () => {
			expect(await trackX(track)).toBeLessThan(atRelease - 20);
		}).toPass();

		/** And once it rests, the nearest index commits as a carousel_slide. */
		await expect(c.event(/0 → \d+ \(right\)/)).toBeVisible();
	});

	test('free-snap: the coast lands exactly on a slide boundary', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'drag-mode');
		await c.root.scrollIntoViewIfNeeded();
		await c.section.getByRole('button', {name: 'free-snap'}).click();
		const track = c.root.locator('[id]');

		const slide = await c.card('Momentum').boundingBox();
		if (!slide) throw new Error('no slide box');
		/** gap=12 in the demo config; boundaries step by the stride slideWidth + gap. */
		const stride = slide.width + 12;

		await dragX(page, c.card('Momentum'), -0.9, {steps: 4});
		await expect(c.event(/0 → \d+ \(right\)/)).toBeVisible();

		/** Wait out the snap animation, then the rest offset must be a stride multiple. */
		await expect(async () => {
			const x = await trackX(track);
			const remainder = Math.abs(x % stride);
			expect(Math.min(remainder, stride - remainder)).toBeLessThan(1.5);
			expect(x).toBeLessThan(-stride / 2);
		}).toPass();
	});

	test('free: clicking the active dot re-aligns an off-boundary rest', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'drag-mode');
		await c.root.scrollIntoViewIfNeeded();
		const track = c.root.locator('[id]');

		const slide = await c.card('Momentum').boundingBox();
		if (!slide) throw new Error('no slide box');
		const stride = slide.width + 12;

		await dragX(page, c.card('Momentum'), -0.9, {steps: 4});
		await expect(c.event(/0 → \d+ \(right\)/)).toBeVisible();

		/** The active dot targets the index the coast settled on — clicking it straightens. */
		await c.activeDot.click();
		await expect(async () => {
			const x = await trackX(track);
			const remainder = Math.abs(x % stride);
			expect(Math.min(remainder, stride - remainder)).toBeLessThan(1.5);
		}).toPass();
	});
});
