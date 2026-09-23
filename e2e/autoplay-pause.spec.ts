import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {edge, expectMovedFrom, scrollToRest, waitForRest} from './support/motion';

/**
 * APG pause behaviour on #auto-scroll (interval 2000 ms by default): hover, keyboard focus,
 * and the visible pause() button must each hold the auto-advance, and releasing them must let
 * it resume. jsdom can't produce any of this — real hover, real focus traversal, real timers.
 * Every "still paused" check waits longer than one interval; every "resumed" check polls with
 * a timeout comfortably above it. Hover tests aim only once the section has stopped scrolling
 * into place (a carousel sliding out from under a parked pointer gets a genuine pointerleave,
 * and the pause latch is — correctly — released mid-test), and read their baseline only once
 * the page has actually registered the hover, which on a loaded machine lags hover() by a frame
 * or more.
 */
test.describe('autoplay pause', () => {
	test('hovering the carousel pauses auto-scroll; leaving resumes it', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'auto-scroll');

		await scrollToRest(c.root);
		await c.root.hover();
		await expect
			.poll(() => c.root.evaluate(el => el.matches(':hover')))
			.toBe(true);
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
		await scrollToRest(section);
		const chip = section.getByText('React', {exact: true}).first();

		/** Aim at the (constant-Y) chip row over the section's horizontal centre. */
		const chipBox = await chip.boundingBox();
		const sectionBox = await section.boundingBox();
		if (!chipBox || !sectionBox) throw new Error('flow has no bounding box');
		await page.mouse.move(
			sectionBox.x + sectionBox.width / 2,
			chipBox.y + chipBox.height / 2,
		);

		/**
		 * The drift comes to rest however late the page registers the hover — sampling right
		 * after the move could still catch it gliding — and then stays put.
		 */
		const x = edge(chip);
		const rest = await waitForRest(x);
		await page.waitForTimeout(500);
		expect(Math.abs((await x()) - rest)).toBeLessThan(1);

		/** Off the carousel the drift picks back up. */
		await page.mouse.move(5, 5);
		await expectMovedFrom(x, rest, 8);
	});
});
