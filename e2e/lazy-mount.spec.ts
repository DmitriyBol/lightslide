import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * #lazy-mount: 12 slides at slidesPerView 2.5, lazyMount {margin: 1} by default. Every card
 * reports its own mount/unmount into the "N of 12 slide subtrees mounted" readout, and
 * off-window slides render as empty shells that keep the slide box — the layout-measured
 * guarantees (equal widths, no shift on mount) that jsdom can't see.
 */
test.describe('lazy mounting', () => {
	test('mounts only the window and keeps shell geometry intact', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#lazy-mount');
		await section.scrollIntoViewIfNeeded();

		/** visible ceil(2.5) = 3 slides + margin 1 → window [0..3]. */
		await expect(
			section.getByText('4 of 12 slide subtrees mounted'),
		).toBeVisible();

		const mountedSlide = section.getByRole('group', {
			name: '1 of 12',
			exact: true,
		});
		const shellSlide = section.getByRole('group', {
			name: '10 of 12',
			exact: true,
		});
		await expect(shellSlide).toBeEmpty();

		/** The shell is the same consumer element — identical box, no reflow on mount. */
		const mountedBox = await mountedSlide.boundingBox();
		const shellBox = await shellSlide.boundingBox();
		if (!mountedBox || !shellBox) throw new Error('slide has no bounding box');
		expect(shellBox.width).toBeCloseTo(mountedBox.width, 0);
	});

	test('navigation slides the window and unmounts slides left behind', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#lazy-mount');
		const c = carousel(page, 'lazy-mount');
		await section.scrollIntoViewIfNeeded();

		await c.next.click();
		await expect(
			section.getByText('5 of 12 slide subtrees mounted'),
		).toBeVisible();

		/** window [1..5] after the second step — slide 1 is behind the margin and unmounts. */
		await c.next.click();
		await expect(
			section.getByText('5 of 12 slide subtrees mounted'),
		).toBeVisible();
		await expect(
			section.getByRole('group', {name: '1 of 12', exact: true}),
		).toBeEmpty();
	});

	test('margin widens the window and the toggle mounts everything', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#lazy-mount');
		await section.scrollIntoViewIfNeeded();

		await section.getByRole('button', {name: '0', exact: true}).click();
		await expect(
			section.getByText('3 of 12 slide subtrees mounted'),
		).toBeVisible();

		await section.getByRole('button', {name: '2', exact: true}).click();
		await expect(
			section.getByText('5 of 12 slide subtrees mounted'),
		).toBeVisible();

		await section.getByRole('switch', {name: 'Toggle lazy mounting'}).click();
		await expect(
			section.getByText('12 of 12 slide subtrees mounted'),
		).toBeVisible();
	});
});
