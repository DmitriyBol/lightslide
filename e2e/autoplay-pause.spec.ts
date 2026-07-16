import type {Locator} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * The playground page keeps moving for a beat after a first jump to a section — reveal
 * transitions and console rows appended above shift the layout — and a carousel that slides
 * out from under a parked pointer gets a genuine pointerleave. Hover tests must aim only
 * after the section's box holds still, or the pause latch is (correctly) released mid-test.
 */
async function settle(target: Locator): Promise<void> {
	await target.scrollIntoViewIfNeeded();
	let prev = await target.boundingBox();
	for (let i = 0; i < 30; i++) {
		await target.page().waitForTimeout(200);
		const cur = await target.boundingBox();
		if (prev && cur && Math.abs(cur.y - prev.y) < 0.5) return;
		prev = cur;
	}
}

/**
 * APG pause behaviour on #auto-scroll (interval 2000 ms by default): hover, keyboard focus,
 * and the visible pause() button must each hold the auto-advance, and releasing them must let
 * it resume. jsdom can't produce any of this — real hover, real focus traversal, real timers.
 * Every "still paused" check waits longer than one interval; every "resumed" check polls with
 * a timeout comfortably above it.
 */
test.describe('autoplay pause', () => {
	test('hovering the carousel pauses auto-scroll; leaving resumes it', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'auto-scroll');

		await settle(c.root);
		await c.root.hover();
		const before = await c.activeDot.getAttribute('aria-label');
		await page.waitForTimeout(2600);
		expect(await c.activeDot.getAttribute('aria-label')).toBe(before);

		/** Park the mouse off the carousel — the next tick advances again. */
		await page.mouse.move(5, 5);
		await expect(c.activeDot).not.toHaveAttribute(
			'aria-label',
			before ?? '',
			{timeout: 5000},
		);
	});

	test('keyboard focus inside pauses auto-scroll; blur resumes it', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'auto-scroll');

		await c.next.focus();
		const before = await c.activeDot.getAttribute('aria-label');
		await page.waitForTimeout(2600);
		expect(await c.activeDot.getAttribute('aria-label')).toBe(before);

		await c.next.blur();
		await expect(c.activeDot).not.toHaveAttribute(
			'aria-label',
			before ?? '',
			{timeout: 5000},
		);
	});

	test('the visible pause() button holds autoplay via the ref handle', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'auto-scroll');

		/** The APG pause control lives in the demo toolbar, outside the carousel landmark. */
		const pauseButton = c.section.getByRole('button', {name: 'pause()'});
		await pauseButton.click();
		const before = await c.activeDot.getAttribute('aria-label');
		await page.waitForTimeout(2600);
		expect(await c.activeDot.getAttribute('aria-label')).toBe(before);

		await c.section.getByRole('button', {name: 'resume()'}).click();
		await expect(c.activeDot).not.toHaveAttribute(
			'aria-label',
			before ?? '',
			{timeout: 5000},
		);
	});

	test('hovering the flow ticker pauses the drift; leaving resumes it', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#flow');
		await settle(section);
		const chip = section.getByText('React', {exact: true}).first();

		/** Aim at the (constant-Y) chip row over the section's horizontal centre. */
		const chipBox = await chip.boundingBox();
		const sectionBox = await section.boundingBox();
		if (!chipBox || !sectionBox) throw new Error('flow has no bounding box');
		await page.mouse.move(
			sectionBox.x + sectionBox.width / 2,
			chipBox.y + chipBox.height / 2,
		);

		const p1 = await chip.boundingBox();
		await page.waitForTimeout(400);
		const p2 = await chip.boundingBox();
		if (!p1 || !p2) throw new Error('flow chip has no bounding box');
		expect(Math.abs(p2.x - p1.x)).toBeLessThan(2);

		/** Off the carousel the drift picks back up on the next frame. */
		await page.mouse.move(5, 5);
		const p3 = await chip.boundingBox();
		await page.waitForTimeout(700);
		const p4 = await chip.boundingBox();
		if (!p3 || !p4) throw new Error('flow chip has no bounding box');
		expect(Math.abs(p4.x - p3.x)).toBeGreaterThan(8);
	});
});
