import type {Locator, Page} from '@playwright/test';

type DragOptions = {
	// Number of intermediate mouse moves. More steps = a smoother, more realistic drag.
	steps?: number;
	// Pause between moves (ms). Used to keep the gesture slow enough that the release velocity stays
	// under the library's flick threshold (0.3 px/ms) — for the "small drag snaps back" case.
	delayMs?: number;
};

// Press at the centre of `surface` and drag horizontally by `fraction` of its width
// (negative = left = advance), emitting real trusted pointer moves via page.mouse. Chromium
// synthesises pointerdown/move/up from these, which is exactly what LightSlide's gesture listens
// to. This is the path the integration tests can't cover: jsdom has no layout, so slideWidth is 0
// and no snap can ever fire.
export async function dragX(
	page: Page,
	surface: Locator,
	fraction: number,
	{steps = 12, delayMs = 0}: DragOptions = {},
): Promise<void> {
	await surface.scrollIntoViewIfNeeded();
	const box = await surface.boundingBox();
	if (!box) throw new Error('dragX: surface has no bounding box');

	const y = box.y + box.height / 2;
	const startX = box.x + box.width / 2;
	const dx = box.width * fraction;

	await page.mouse.move(startX, y);
	await page.mouse.down();
	for (let i = 1; i <= steps; i++) {
		await page.mouse.move(startX + (dx * i) / steps, y);
		if (delayMs) await page.waitForTimeout(delayMs);
	}
	await page.mouse.up();
}
