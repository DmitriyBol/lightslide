import type {Locator} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX} from './support/gestures';

/**
 * `slidesPerView="auto"` against the live layout — the half jsdom cannot reach, since every
 * measurement there is 0. The #auto-width demo renders seven slides of deliberately different
 * widths (120/210/90/250/110/150/170) at gap 12, with a loop Toggle.
 *
 * The invariants worth proving in a real browser: slides keep their own widths, positions are
 * measured rather than derived (trailing slides that share the last viewport collapse into one
 * flush position), a real pointer drag snaps to a measured boundary, and auto + loop wraps
 * without a gap — the combination competitors leave broken. Assertions poll, because every
 * snap animates for ~300 ms.
 */

const SLIDE_WIDTHS = [120, 210, 90, 250, 110, 150, 170];

/** Polls until the slide's left edge coincides with the carousel viewport's (±2 px). */
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

test.describe('slidesPerView auto', () => {
	test('renders every slide at its own content width', async ({page}) => {
		await page.goto('/#auto-width');
		const c = carousel(page, 'auto-width');
		await c.root.scrollIntoViewIfNeeded();

		const widths = await c.section
			.locator('[aria-roledescription="slide"]')
			.evaluateAll(nodes =>
				nodes.map(n => Math.round(n.getBoundingClientRect().width)),
			);
		expect(widths).toEqual(SLIDE_WIDTHS);
	});

	test('measures the reachable positions instead of one per slide', async ({
		page,
	}) => {
		await page.goto('/#auto-width');
		const c = carousel(page, 'auto-width');
		await c.root.scrollIntoViewIfNeeded();

		/**
		 * The trailing slides share the final viewport, so they collapse into a single flush
		 * position: fewer dots than slides, and the count matches what the measured geometry
		 * allows for the live viewport width.
		 */
		const dots = c.section.getByRole('button', {name: /Go to slide/});
		const dotCount = await dots.count();
		expect(dotCount).toBeLessThan(SLIDE_WIDTHS.length);

		const viewport = await c.root.boundingBox();
		if (!viewport) throw new Error('no viewport box');
		const content =
			SLIDE_WIDTHS.reduce((a, b) => a + b, 0) + (SLIDE_WIDTHS.length - 1) * 12;
		let edge = 0;
		const edges = SLIDE_WIDTHS.map(w => {
			const at = edge;
			edge += w + 12;
			return at;
		});
		const maxOffset = Math.max(0, content - viewport.width);
		const expectedPositions = edges.findIndex(e => e >= maxOffset) + 1;
		expect(dotCount).toBe(expectedPositions);
	});

	test('navigates to measured boundaries and rests the last one flush', async ({
		page,
	}) => {
		await page.goto('/#auto-width');
		const c = carousel(page, 'auto-width');
		await c.root.scrollIntoViewIfNeeded();

		await c.next.click();
		await expectFlushLeft(c.section.getByRole('group', {name: '2 of 7'}), c.root);

		/** The final position clamps flush to the right edge — no blank space past the content. */
		const dots = c.section.getByRole('button', {name: /Go to slide/});
		await dots.last().click();

		await expect
			.poll(async () => {
				const last = await c.section
					.locator('[aria-roledescription="slide"]')
					.last()
					.boundingBox();
				const r = await c.root.boundingBox();
				if (!last || !r) return Number.NaN;
				return Math.abs(last.x + last.width - (r.x + r.width));
			})
			.toBeLessThanOrEqual(2);
	});

	test('a real drag snaps to the nearest measured boundary', async ({page}) => {
		await page.goto('/#auto-width');
		const c = carousel(page, 'auto-width');
		await c.root.scrollIntoViewIfNeeded();

		/**
		 * Drag the viewport ~60% of its width. The boundaries here are irregular (0, 132, 354,
		 * 456…), so the release lands on slide 3's measured edge — a stride-based snap, which
		 * has no such edge, could not.
		 */
		await dragX(page, c.root, -0.6);
		await expectFlushLeft(c.section.getByRole('group', {name: '3 of 7'}), c.root);
	});

	test('wraps seamlessly with loop on — the combination that breaks elsewhere', async ({
		page,
	}) => {
		await page.goto('/#auto-width');
		const c = carousel(page, 'auto-width');
		await c.root.scrollIntoViewIfNeeded();
		await c.section.getByRole('switch', {name: 'loop'}).click();

		/** Backward from the first slide wraps onto the last reachable position, flush-left. */
		await c.prev.click();
		const dots = c.section.getByRole('button', {name: /Go to slide/});
		await expect(dots.last()).toHaveAttribute('aria-current', 'true');

		/** Forward again returns to the first slide, still aligned — no drift across the wrap. */
		await c.next.click();
		await expectFlushLeft(c.section.getByRole('group', {name: '1 of 7'}), c.root);
	});
});
