import {expect, test} from '@playwright/test';

/**
 * #flow is a continuously drifting ticker (slidesPerView 3.5, speed 40 px/s, no controls). The
 * rAF-driven transform moves the cards on their own, with zero interaction — exactly what jsdom
 * can't produce (no rAF layout, no measured transform). We assert the drift by sampling a chip's
 * position over time.
 */
test.describe('flow ticker', () => {
	test('drifts on its own without any interaction', async ({page}) => {
		await page.goto('/');
		/**
		 * Scroll the (stable) section into view — not the chip itself: a continuously drifting
		 * element never satisfies scrollIntoViewIfNeeded's stability wait. boundingBox() then reads
		 * the chip's live position without requiring it to hold still.
		 */
		await page.locator('#flow').scrollIntoViewIfNeeded();
		const chip = page
			.locator('#flow')
			.getByText('React', {exact: true})
			.first();

		const before = await chip.boundingBox();
		await page.waitForTimeout(700);
		const after = await chip.boundingBox();
		if (!before || !after) throw new Error('flow chip has no bounding box');

		/** ~40 px/s × 0.7 s ≈ 28 px of drift; require a delta comfortably above measurement noise. */
		expect(Math.abs(after.x - before.x)).toBeGreaterThan(10);
	});

	test('stays grabbable after dragging deep into the clone window', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#flow');
		const region = section.locator('[aria-roledescription="carousel"]');
		await region.scrollIntoViewIfNeeded();
		/** Let the smooth scroll and the reveal animation settle before taking coordinates. */
		await page.waitForTimeout(900);

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
		async function drag(dx: number) {
			const box = await region.boundingBox();
			if (!box) throw new Error('flow region has no bounding box');
			const y = box.y + box.height / 2;
			const x = box.x + box.width / 2;
			await page.mouse.move(x, y);
			await page.mouse.down();
			for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dx * i) / 8, y);
			const during = await transform();
			await page.mouse.up();
			return during;
		}

		for (let i = 0; i < 6; i++) await drag(-250);

		/** The strip is now parked on clones — a right drag must still track the pointer. */
		const start = await transform();
		const during = await drag(250);
		expect(during - start).toBeGreaterThan(200);
	});

	test('a drag pauses the drift; it resumes after resumeDelay', async ({
		page,
	}) => {
		await page.goto('/');
		const section = page.locator('#flow');
		await section.scrollIntoViewIfNeeded();
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

		/** Frozen well inside the resume window. */
		const p1 = await chip.boundingBox();
		await page.waitForTimeout(250);
		const p2 = await chip.boundingBox();
		if (!p1 || !p2) throw new Error('flow chip has no bounding box');
		expect(Math.abs(p2.x - p1.x)).toBeLessThan(2);

		/** Past the delay, the drift picks back up on its own. */
		await page.waitForTimeout(1600);
		const p3 = await chip.boundingBox();
		await page.waitForTimeout(400);
		const p4 = await chip.boundingBox();
		if (!p3 || !p4) throw new Error('flow chip has no bounding box');
		expect(Math.abs(p4.x - p3.x)).toBeGreaterThan(8);
	});
});
