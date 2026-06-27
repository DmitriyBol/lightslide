import {expect, test} from '@playwright/test';

// #flow is a continuously drifting ticker (slidesPerView 3.5, speed 40 px/s, no controls). The
// rAF-driven transform moves the cards on their own, with zero interaction — exactly what jsdom
// can't produce (no rAF layout, no measured transform). We assert the drift by sampling a chip's
// position over time.
test.describe('flow ticker', () => {
	test('drifts on its own without any interaction', async ({page}) => {
		await page.goto('/');
		// Scroll the (stable) section into view — not the chip itself: a continuously drifting
		// element never satisfies scrollIntoViewIfNeeded's stability wait. boundingBox() then reads
		// the chip's live position without requiring it to hold still.
		await page.locator('#flow').scrollIntoViewIfNeeded();
		const chip = page
			.locator('#flow')
			.getByText('React', {exact: true})
			.first();

		const before = await chip.boundingBox();
		await page.waitForTimeout(700);
		const after = await chip.boundingBox();
		if (!before || !after) throw new Error('flow chip has no bounding box');

		// ~40 px/s × 0.7 s ≈ 28 px of drift; require a delta comfortably above measurement noise.
		expect(Math.abs(after.x - before.x)).toBeGreaterThan(10);
	});
});
