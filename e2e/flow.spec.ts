import {expect, test} from '@playwright/test';

import {edge, expectMovedFrom, scrollToRest, waitForRest} from './support/motion';

/**
 * #flow is a continuously drifting ticker (slidesPerView 3.5, speed 40 px/s, no controls). The
 * rAF-driven transform moves the cards on their own, with zero interaction — exactly what jsdom
 * can't produce (no rAF layout, no measured transform). We assert the drift by polling a chip's
 * position — for the motion itself, never a fixed sleep between two samples (see motion.ts).
 */
test.describe('flow ticker', () => {
	test('drifts on its own without any interaction', async ({page}) => {
		await page.goto('/');
		/**
		 * Scroll the (stable) section into view — not the chip itself: a continuously drifting
		 * element never satisfies scrollIntoViewIfNeeded's stability wait. boundingBox() then reads
		 * the chip's live position without requiring it to hold still.
		 */
		await scrollToRest(page.locator('#flow'));
		const x = edge(
			page.locator('#flow').getByText('React', {exact: true}).first(),
		);

		/** 40 px/s; require a delta comfortably above measurement noise. */
		await expectMovedFrom(x, await x(), 10);
	});

	test('stays grabbable after dragging deep into the clone window', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#flow');
		const region = section.locator('[aria-roledescription="carousel"]');
		/** Coordinates are taken once the smooth scroll and the reveal animation have settled. */
		await scrollToRest(region);

		const track = region.locator('[id]');
		const transform = async () => {
			const s = await track.evaluate(el => el.style.transform);
			return Math.round(Number(/-?[\d.]+/.exec(s)?.[0] ?? NaN));
		};

		/**
		 * Repeated left drags park the viewport on the appended loop clones (pixel-identical to
		 * the real slides, so the strip looks perfectly normal). Clones are aria-hidden + inert;
		 * without pointer-events: none on them the next grab would land on an inert target,
		 * whose pointer events Chromium never dispatches — and the strip would freeze for the
		 * user. The cursor never leaves the carousel, exactly the reported gesture.
		 */
		async function press(dx: number) {
			const box = await region.boundingBox();
			if (!box) throw new Error('flow region has no bounding box');
			const y = box.y + box.height / 2;
			const x = box.x + box.width / 2;
			await page.mouse.move(x, y);
			await page.mouse.down();
			for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dx * i) / 8, y);
		}

		for (let i = 0; i < 6; i++) {
			await press(-250);
			await page.mouse.up();
		}

		/**
		 * The strip is now parked on clones — a right drag must still track the pointer. The
		 * page may handle the moves a frame or more after they are sent, so the transform is
		 * polled while the button is still held rather than read once.
		 */
		const start = await waitForRest(transform);
		await press(250);
		await expect
			.poll(async () => (await transform()) - start)
			.toBeGreaterThan(200);
		await page.mouse.up();
	});

	test('a drag pauses the drift; it resumes after resumeDelay', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#flow');
		await scrollToRest(section);
		const chip = section.getByText('React', {exact: true}).first();

		/**
		 * Drag across the ticker row. We build the coordinates by hand: the chips drift, so we can't
		 * aim at a moving target, but their row Y is constant and the section's horizontal centre is
		 * always over the full-width track. pointerdown pauses the drift at once; pointerup arms the
		 * resume timer (FlowExample sets resumeDelay: 1500).
		 */
		const chipBox = await chip.boundingBox();
		const sectionBox = await section.boundingBox();
		if (!chipBox || !sectionBox) throw new Error('flow has no bounding box');
		const y = chipBox.y + chipBox.height / 2;
		const x = sectionBox.x + sectionBox.width / 2;
		await page.mouse.move(x, y);
		await page.mouse.down();
		for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 6, y);
		await page.mouse.up();

		/**
		 * Park the mouse off the carousel: hovering pauses the drift by default now
		 * (pauseOnHover), which would otherwise hold it past the resume window.
		 */
		await page.mouse.move(5, 5);

		/**
		 * Frozen inside the resume window: two samples 150 ms apart agree, which the 40 px/s
		 * drift can never produce — and past the delay it picks back up on its own.
		 */
		const chipX = edge(chip);
		const rest = await waitForRest(chipX);
		await expectMovedFrom(chipX, rest, 8);
	});
});
