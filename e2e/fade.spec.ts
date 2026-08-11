import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {dragX} from './support/gestures';

/**
 * The #fade demo: four looped banner slides with the `lightslide/fade` plugin on. What only
 * a real browser can prove: the injected stylesheet actually outranks the core's inline
 * track transform (computed `transform: none`, `display: grid`), the crossfade lands on
 * computed opacity, and a swipe still changes the slide with no track motion. Slides 1 and
 * 4 have loop clones sharing their aria-label, so probes address slides 2 and 3 — unique in
 * the strip.
 */

/** The track element — the slides' shared parent (its id is the aria-controls target). */
function getTrack(root: Locator): Locator {
	return root.locator('[aria-roledescription="slide"]').first().locator('..');
}

function getSlide(page: Page, label: string): Locator {
	return page.locator(
		`#fade [aria-roledescription="slide"][aria-label="${label}"]`,
	);
}

async function computedOpacity(slide: Locator): Promise<number> {
	return Number.parseFloat(
		await slide.evaluate(el => getComputedStyle(el).opacity),
	);
}

test.describe('fade', () => {
	test('stacks the slides in a grid and keeps the track untranslated', async ({
		page,
	}) => {
		await page.goto('/#fade');
		const c = carousel(page, 'fade');
		await c.root.scrollIntoViewIfNeeded();
		const track = getTrack(c.root);

		await expect
			.poll(() => track.evaluate(el => getComputedStyle(el).display))
			.toBe('grid');

		/** Navigation writes an inline translate — the fade stylesheet must outrank it. */
		await c.next.click();
		await expect(c.dot(2)).toHaveAttribute('aria-current', 'true');
		await expect
			.poll(() => track.evaluate(el => getComputedStyle(el).transform))
			.toBe('none');
	});

	test('crossfades to the next slide', async ({page}) => {
		await page.goto('/#fade');
		const c = carousel(page, 'fade');
		await c.root.scrollIntoViewIfNeeded();

		expect(await computedOpacity(getSlide(page, '2 of 4'))).toBe(0);

		await c.next.click();
		await expect
			.poll(() => computedOpacity(getSlide(page, '2 of 4')))
			.toBe(1);
		expect(await computedOpacity(getSlide(page, '3 of 4'))).toBe(0);
	});

	test('only the active slide is interactive or exposed', async ({page}) => {
		await page.goto('/#fade');
		const c = carousel(page, 'fade');
		await c.root.scrollIntoViewIfNeeded();

		await c.next.click();
		const active = getSlide(page, '2 of 4');
		const hidden = getSlide(page, '3 of 4');
		await expect(active).not.toHaveAttribute('aria-hidden', 'true');
		await expect(active).not.toHaveAttribute('inert', '');
		await expect(hidden).toHaveAttribute('aria-hidden', 'true');
		await expect(hidden).toHaveAttribute('inert', '');
		await expect
			.poll(() => hidden.evaluate(el => getComputedStyle(el).pointerEvents))
			.toBe('none');
	});

	test('a swipe still turns the page — with no sideways motion to see', async ({
		page,
	}) => {
		await page.goto('/#fade');
		const c = carousel(page, 'fade');
		await c.root.scrollIntoViewIfNeeded();

		await dragX(page, c.root, -0.5);
		await expect(c.dot(2)).toHaveAttribute('aria-current', 'true');
		await expect
			.poll(() => computedOpacity(getSlide(page, '2 of 4')))
			.toBe(1);
	});

	test('toggling the plugin off restores the sliding track mid-session', async ({
		page,
	}) => {
		await page.goto('/#fade');
		const c = carousel(page, 'fade');
		await c.root.scrollIntoViewIfNeeded();
		const track = getTrack(c.root);

		await c.next.click();
		await expect(c.dot(2)).toHaveAttribute('aria-current', 'true');

		await c.section.getByRole('switch', {name: 'fade'}).click();
		await expect
			.poll(() => track.evaluate(el => getComputedStyle(el).display))
			.toBe('flex');
		/** The core kept writing its inline transform all along — it re-applies untouched. */
		await expect
			.poll(() => track.evaluate(el => getComputedStyle(el).transform))
			.not.toBe('none');
		await expect
			.poll(() => computedOpacity(getSlide(page, '3 of 4')))
			.toBe(1);
	});
});
