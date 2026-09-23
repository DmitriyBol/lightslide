import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * prefers-reduced-motion, rendered: the core snaps instantly — no CSS transition ever runs on
 * the track — and the loop wrap, whose silent re-snap normally waits for transitionend, still
 * lands on the real slide. The branch is unit-covered in useTrackSnap; this proves the promise
 * in a real browser. Emulated per page with emulateMedia — `test.use({reducedMotion})` is
 * silently ignored here. #loop: 5 slides, slidesPerView 1, loop on, arrows + dots.
 */
test.describe('reduced motion', () => {
	test.beforeEach(async ({page}) => {
		await page.emulateMedia({reducedMotion: 'reduce'});
		await page.goto('/');
	});

	test('navigation snaps instantly — no transition runs on the track', async ({
		page,
	}) => {
		const c = carousel(page, 'loop');
		await c.root.scrollIntoViewIfNeeded();
		const track = c.section.getByRole('group', {name: '1 of 5'}).locator('..');

		/**
		 * Press next from inside the page and count the track's own transitions over the next
		 * few frames: a transition starts at the first style recalc after the transform
		 * changes, so an animated snap cannot slip past the window, however loaded the machine.
		 */
		const runs = await track.evaluate(
			el =>
				new Promise<number>(resolve => {
					let count = 0;
					el.addEventListener('transitionrun', e => {
						if (e.target === el) count++;
					});
					el.closest('[aria-roledescription="carousel"]')
						?.querySelector<HTMLElement>('[aria-label="Next slide"]')
						?.click();
					let frames = 0;
					const tick = () => {
						if (++frames < 5) requestAnimationFrame(tick);
						else resolve(count);
					};
					requestAnimationFrame(tick);
				}),
		);

		expect(runs).toBe(0);
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 2');
	});

	test('the loop wrap still lands on the real slide with no transitionend to wait for', async ({
		page,
	}) => {
		const c = carousel(page, 'loop');
		await c.root.scrollIntoViewIfNeeded();

		await c.prev.click();

		/** Instant, so no polling: the re-snap has already run by the time the click returns. */
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');
		const last = await c.section
			.getByRole('group', {name: '5 of 5'})
			.boundingBox();
		const root = await c.root.boundingBox();
		if (!last || !root) throw new Error('slide or carousel has no bounding box');
		expect(Math.abs(last.x - root.x)).toBeLessThanOrEqual(1);
	});
});
