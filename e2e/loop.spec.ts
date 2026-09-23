import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX} from './support/gestures';

/**
 * #loop is a single loop carousel (5 slides, slidesPerView 1) with default arrows, pagination,
 * and a <Console>. In loop mode the arrows never disable and the edges wrap around via cloned
 * slides — behaviour that only reads correctly with real layout.
 */
test.describe('loop mode', () => {
	test('arrows stay enabled; prev from the first slide wraps to the last', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await expect(c.prev).toBeEnabled();
		await expect(c.next).toBeEnabled();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');

		await c.prev.click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');
		await expect(c.event(/0 → 4/).first()).toBeVisible();
	});

	test('next from the last slide wraps back to the first', async ({page}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await c.dot(5).click();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');

		await c.next.click();

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
		await expect(c.event(/4 → 0/).first()).toBeVisible();
	});

	/**
	 * Drag wraps exercise the full untrimmed path — getSnapIndex signalling an out-of-range
	 * index and the wrap dance through the real useTrackSnap — where the arrow tests above
	 * enter through navigateToIndex directly.
	 */
	test('dragging left past the last slide wraps to the first', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await c.dot(5).click();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');

		await dragX(page, c.root, -0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
		await expect(c.event(/4 → 0/).first()).toBeVisible();
	});

	test('dragging right before the first slide wraps to the last', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');

		await dragX(page, c.root, 0.6);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 5');
		await expect(c.event(/0 → 4/).first()).toBeVisible();
	});

	/**
	 * A press landing mid-wrap: the browser cancels the replaced transition a frame after the
	 * second snap subscribed, and taking that echo for its own cancel used to drop the silent
	 * re-snap — the track parked on the inert clone, the real slide a whole strip away. The
	 * second press is fired from the first transition's `transitionrun`, so it hits the
	 * running animation deterministically, however loaded the machine is.
	 */
	test('a press during the wrap animation still settles on the real slide', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'loop');
		await c.root.scrollIntoViewIfNeeded();
		const first = c.section.getByRole('group', {name: '1 of 5'});

		await first.locator('..').evaluate(
			track =>
				new Promise<void>(resolve => {
					const press = (name: string) =>
						track
							.closest('[aria-roledescription="carousel"]')
							?.querySelector<HTMLElement>(`[aria-label="${name}"]`)
							?.click();
					const onRun = (e: Event) => {
						if (e.target !== track) return;
						track.removeEventListener('transitionrun', onRun);
						press('Next slide');
						resolve();
					};
					track.addEventListener('transitionrun', onRun);
					press('Previous slide');
				}),
		);

		await expect(c.activeDot).toHaveAccessibleName('Go to slide 1');
		await expect
			.poll(async () => {
				const s = await first.boundingBox();
				const r = await c.root.boundingBox();
				return s && r ? Math.abs(s.x - r.x) : Number.NaN;
			})
			.toBeLessThanOrEqual(1);
	});
});
