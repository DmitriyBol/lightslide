import type {Locator} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * align="center" geometry against the live layout: the #align demo renders 5 slides at
 * slidesPerView 1.6 / gap 12, centred + looped by default, with a start/center Segmented
 * and a loop Toggle. Real slides carry the automatic "N of 5" group name; loop clones
 * are aria-hidden, so role-based lookups always hit the real slide. Assertions poll the
 * live distance until the snap animation lands — a one-shot read races the 300 ms
 * transition.
 */

const centerX = (box: {x: number; width: number}) => box.x + box.width / 2;

/** Polls until the slide's centre coincides with the carousel's (±2 px). */
async function expectCentred(slide: Locator, root: Locator) {
	await expect
		.poll(async () => {
			const s = await slide.boundingBox();
			const r = await root.boundingBox();
			if (!s || !r) return Number.NaN;
			return Math.abs(centerX(s) - centerX(r));
		})
		.toBeLessThanOrEqual(2);
}

/** Polls until the slide's left edge coincides with the carousel's (±2 px). */
async function expectFlushLeft(slide: Locator, root: Locator) {
	await expect
		.poll(async () => {
			const s = await slide.boundingBox();
			const r = await root.boundingBox();
			if (!s || !r) return Number.NaN;
			return Math.abs(s.x - r.x);
		})
		.toBeLessThanOrEqual(2);
}

test.describe('align center', () => {
	test('centres the active slide in loop mode, including after navigation', async ({
		page,
	}) => {
		await page.goto('/#align');
		const c = carousel(page, 'align');
		await c.root.scrollIntoViewIfNeeded();

		await expectCentred(c.section.getByRole('group', {name: '1 of 5'}), c.root);

		await c.next.click();
		await expectCentred(c.section.getByRole('group', {name: '2 of 5'}), c.root);
	});

	test('wraps backward onto a centred last slide', async ({page}) => {
		await page.goto('/#align');
		const c = carousel(page, 'align');
		await c.root.scrollIntoViewIfNeeded();

		await c.prev.click();
		await expectCentred(c.section.getByRole('group', {name: '5 of 5'}), c.root);
	});

	test('rests flush at the edges without loop (containScroll), centred in between', async ({
		page,
	}) => {
		await page.goto('/#align');
		const c = carousel(page, 'align');
		await c.root.scrollIntoViewIfNeeded();

		await c.section.getByRole('switch').click();

		/** First position clamps flush left — no blank space before slide 1. */
		await expectFlushLeft(
			c.section.getByRole('group', {name: '1 of 5'}),
			c.root,
		);

		/** An intermediate position is centred. */
		await c.next.click();
		await expectCentred(c.section.getByRole('group', {name: '2 of 5'}), c.root);
	});

	test('align="start" keeps the active slide on the left edge', async ({
		page,
	}) => {
		await page.goto('/#align');
		const c = carousel(page, 'align');
		await c.root.scrollIntoViewIfNeeded();

		await c.section.getByRole('button', {name: 'start', exact: true}).click();

		await expectFlushLeft(
			c.section.getByRole('group', {name: '1 of 5'}),
			c.root,
		);
	});
});
