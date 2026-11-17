import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * #combo-matrix: one 7-slide carousel with live knobs for every layout axis — loop ×
 * slidesPerView (1 / 1.2 fractional / 2 / 3) × align × gap × axis. This is the combo zone
 * where competitors' trackers fill up (Swiper's loop + multi-perView + centeredSlides
 * cluster), so the invariants below are asserted per cell of the matrix rather than per
 * feature: at every resting position the active slide sits exactly where its `align`
 * promises (flush at the leading edge, or centred), loop wraps in both directions land on
 * the promised position, and without loop the last position clamps flush — the track's
 * trailing content meets the viewport edge with no blank run-out.
 *
 * Everything is measured from live boxes (poll, never one-shot reads — the 300 ms snap
 * transition must be allowed to land) and addressed by roles/aria only.
 */

const SLIDE_COUNT = 7;
const GAP = 24;

type Axis = 'x' | 'y';
type Align = 'start' | 'center';
type Cell = {loop: boolean; spv: number; align: Align; gap?: number; axis?: Axis};

const configLine = (cell: Cell) =>
	`loop=${cell.loop ? 'on' : 'off'} · slidesPerView=${cell.spv} · align=${cell.align} · gap=${cell.gap ?? 0} · axis=${cell.axis ?? 'x'}`;

/** The slide at 0-based `index`; clones are aria-hidden, so role lookups hit the real one. */
const slide = (c: ReturnType<typeof carousel>, index: number): Locator =>
	c.section.getByRole('group', {name: `${index + 1} of ${SLIDE_COUNT}`});

const maxIndex = (spv: number): number => Math.ceil(SLIDE_COUNT - spv);

/**
 * Dials the section knobs to the cell and awaits the readout confirming the remount
 * committed. Toggles start from the section defaults (loop on, gap off, axis x); segments
 * are idempotent to click.
 */
async function configure(page: Page, cell: Cell) {
	const section = page.locator('#combo-matrix');
	/** Reveal the section first — its entrance animation keeps controls unclickable before. */
	await section.scrollIntoViewIfNeeded();
	await section.getByRole('button', {name: String(cell.spv), exact: true}).click();
	await section.getByRole('button', {name: cell.align, exact: true}).click();
	if (!cell.loop) await section.getByRole('switch', {name: 'loop'}).click();
	if (cell.gap) await section.getByRole('switch', {name: 'gap'}).click();
	if (cell.axis === 'y') await section.getByRole('switch', {name: 'axis'}).click();
	await expect(section.getByText(configLine(cell))).toBeVisible();
}

/** Box helpers working along either axis: leading edge (left/top), trailing, centre. */
type Box = {x: number; y: number; width: number; height: number};
const lead = (b: Box, axis: Axis): number => (axis === 'x' ? b.x : b.y);
const trail = (b: Box, axis: Axis): number =>
	axis === 'x' ? b.x + b.width : b.y + b.height;
const mid = (b: Box, axis: Axis): number =>
	axis === 'x' ? b.x + b.width / 2 : b.y + b.height / 2;

async function boxOf(locator: Locator): Promise<Box> {
	const b = await locator.boundingBox();
	if (!b) throw new Error(`${await locator.getAttribute('aria-label') ?? 'element'} has no box`);
	return b;
}

/**
 * The scrolling viewport a slide lives in — the carousel root can be taller (the pagination
 * dot row sits below the viewport on the vertical axis), so position promises are measured
 * against the viewport: slide → track → viewport.
 */
const viewportOf = (slideL: Locator): Locator => slideL.locator('xpath=../..');

/** Polls until the slide's leading edge meets the viewport's (±tol) — align="start" rest. */
async function expectFlushLeading(slideL: Locator, axis: Axis) {
	await expect
		.poll(async () => {
			const s = await slideL.boundingBox();
			const r = await viewportOf(slideL).boundingBox();
			if (!s || !r) return Number.NaN;
			return Math.abs(lead(s, axis) - lead(r, axis));
		})
		.toBeLessThanOrEqual(2);
}

/** Polls until the slide's centre meets the viewport's (±tol) — align="center" rest. */
async function expectCentred(slideL: Locator, axis: Axis) {
	await expect
		.poll(async () => {
			const s = await slideL.boundingBox();
			const r = await viewportOf(slideL).boundingBox();
			if (!s || !r) return Number.NaN;
			return Math.abs(mid(s, axis) - mid(r, axis));
		})
		.toBeLessThanOrEqual(2);
}

/**
 * Polls until the slide's trailing edge meets the viewport's (±tol) — the no-loop last
 * position under align="start": fractional or not, the final visible slide must scroll
 * flush, never leaving a blank strip past the content.
 */
async function expectFlushTrailing(slideL: Locator, axis: Axis) {
	await expect
		.poll(async () => {
			const s = await slideL.boundingBox();
			const r = await viewportOf(slideL).boundingBox();
			if (!s || !r) return Number.NaN;
			return Math.abs(trail(s, axis) - trail(r, axis));
		})
		.toBeLessThanOrEqual(2);
}

/** The promised rest position for the active slide under the cell's align (loop active). */
async function expectAtAlign(c: ReturnType<typeof carousel>, index: number, cell: Cell) {
	const axis = cell.axis ?? 'x';
	if (cell.align === 'center') {
		await expectCentred(slide(c, index), axis);
	} else {
		await expectFlushLeading(slide(c, index), axis);
	}
}

/** The active slide never sticks out of the viewport, in any combo. */
async function expectInside(c: ReturnType<typeof carousel>, index: number, cell: Cell) {
	const axis = cell.axis ?? 'x';
	const s = await boxOf(slide(c, index));
	const r = await boxOf(viewportOf(slide(c, index)));
	expect(lead(s, axis)).toBeGreaterThanOrEqual(lead(r, axis) - 2);
	expect(trail(s, axis)).toBeLessThanOrEqual(trail(r, axis) + 2);
}

test.describe('combo matrix: loop × slidesPerView × align', () => {
	/** The full 2 × 4 × 2 grid on the horizontal axis, gap 0. */
	const cells: Cell[] = [];
	for (const loop of [true, false])
		for (const spv of [1, 1.2, 2, 3])
			for (const align of ['start', 'center'] as Align[])
				cells.push({loop, spv, align});

	for (const cell of cells) {
		test(`rest, wrap and clamp: ${configLine(cell)}`, async ({page}) => {
			await page.goto('/#combo-matrix');
			const c = carousel(page, 'combo-matrix');
			await configure(page, cell);
			await c.root.scrollIntoViewIfNeeded();

			if (cell.loop) {
				/**
				 * The last scrollable position — with spv > 1 that is NOT the last slide (7
				 * slides at spv 2 end on slide 6; slide 7 is just its right neighbour).
				 */
				const last = maxIndex(cell.spv);

				/** First position rests where align promises; the slide stays inside. */
				await expectAtAlign(c, 0, cell);
				await expectInside(c, 0, cell);

				/** Wrap backward from the start: the final position takes the promise. */
				await c.prev.click();
				await expectAtAlign(c, last, cell);
				await expectInside(c, last, cell);

				/** Wrap forward from the final position: slide 1 returns to the promise. */
				await c.next.click();
				await expectAtAlign(c, 0, cell);

				/** next lands the second slide on the same promise. */
				await c.next.click();
				await expectAtAlign(c, 1, cell);
				await expectInside(c, 1, cell);

				/** Pagination jumps to the final position and wraps forward from there. */
				await c.dot(last + 1).click();
				await expectAtAlign(c, last, cell);
				await c.next.click();
				await expectAtAlign(c, 0, cell);
			} else {
				/**
				 * Without loop the first position clamps flush at the leading edge for either
				 * align (containScroll) — no half-slide peek past the content.
				 */
				await expectFlushLeading(slide(c, 0), 'x');
				await expectInside(c, 0, cell);

				/**
				 * An intermediate position keeps the align promise (centred for center, flush
				 * for start).
				 */
				await c.next.click();
				await expectAtAlign(c, 1, cell);

				/**
				 * The final position: align="start" clamps flush at the trailing edge (the
				 * last slide meets it, no blank run-out); align="center" centres its active
				 * slide when the strip is long enough, and otherwise clamps flush at the
				 * trailing edge (containScroll — the centred rest would over-scroll).
				 */
				await c.dot(maxIndex(cell.spv) + 1).click();
				if (cell.align === 'center') {
					const active = slide(c, maxIndex(cell.spv));
					const last = slide(c, SLIDE_COUNT - 1);
					await expect
						.poll(async () => {
							const a = await active.boundingBox();
							const l = await last.boundingBox();
							const v = await viewportOf(active).boundingBox();
							if (!a || !l || !v) return Number.NaN;
							return Math.min(
								Math.abs(mid(a, 'x') - mid(v, 'x')),
								Math.abs(trail(l, 'x') - trail(v, 'x')),
							);
						})
						.toBeLessThanOrEqual(2);
				} else {
					await expectFlushTrailing(slide(c, SLIDE_COUNT - 1), 'x');
				}
				await expectInside(c, maxIndex(cell.spv), cell);
			}
		});
	}
});

test.describe('combo matrix: gap combinations', () => {
	/** gap folds into every geometry formula — exercised on both aligns, whole & fractional spv. */
	const cells: Cell[] = [
		{loop: true, spv: 1.2, align: 'center', gap: GAP},
		{loop: true, spv: 3, align: 'start', gap: GAP},
		{loop: false, spv: 2, align: 'center', gap: GAP},
		{loop: false, spv: 1.2, align: 'start', gap: GAP},
	];

	for (const cell of cells) {
		test(`gap-accurate rests and wraps: ${configLine(cell)}`, async ({page}) => {
			await page.goto('/#combo-matrix');
			const c = carousel(page, 'combo-matrix');
			await configure(page, cell);
			await c.root.scrollIntoViewIfNeeded();

			/** Loop keeps the align promise at position 0; without loop it clamps flush. */
			if (cell.loop) {
				await expectAtAlign(c, 0, cell);
				await c.prev.click();
				await expectAtAlign(c, maxIndex(cell.spv), cell);
			} else {
				await expectFlushLeading(slide(c, 0), 'x');
				await c.dot(maxIndex(cell.spv) + 1).click();
				if (cell.align === 'center') {
					await expectAtAlign(c, maxIndex(cell.spv), cell);
				} else {
					await expectFlushTrailing(slide(c, SLIDE_COUNT - 1), 'x');
				}
			}
		});
	}
});

test.describe('combo matrix: vertical axis', () => {
	/** The same promises along Y: leading edge is top, trailing is bottom. */
	const cells: Cell[] = [
		{loop: true, spv: 1, align: 'center', axis: 'y'},
		{loop: true, spv: 1.2, align: 'start', axis: 'y'},
		{loop: false, spv: 2, align: 'center', axis: 'y'},
		{loop: true, spv: 2, align: 'start', axis: 'y'},
	];

	for (const cell of cells) {
		test(`vertical rests and wraps: ${configLine(cell)}`, async ({page}) => {
			await page.goto('/#combo-matrix');
			const c = carousel(page, 'combo-matrix');
			await configure(page, cell);
			await c.root.scrollIntoViewIfNeeded();

			/** Loop keeps the align promise at position 0; without loop it clamps flush top. */
			if (cell.loop) {
				await expectAtAlign(c, 0, cell);
			} else {
				await expectFlushLeading(slide(c, 0), 'y');
			}

			await c.next.click();
			await expectAtAlign(c, 1, cell);

			if (cell.loop) {
				await c.prev.click();
				await c.prev.click();
				/**
				 * Two steps back from slide 2: slide 1, then the backward wrap onto the final
				 * position (slide maxIndex+1, not necessarily the last slide), centred or
				 * flush top as align promises.
				 */
				await expectAtAlign(c, maxIndex(cell.spv), cell);
			} else {
				await c.dot(maxIndex(cell.spv) + 1).click();
				if (cell.align === 'center') {
					await expectAtAlign(c, maxIndex(cell.spv), cell);
				} else {
					await expectFlushTrailing(slide(c, SLIDE_COUNT - 1), 'y');
				}
			}
		});
	}
});
