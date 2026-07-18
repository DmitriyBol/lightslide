import {expect, test} from '@playwright/test';

/**
 * Every demo section id rendered by the playground (see App.tsx). Their collective presence is the
 * cheapest guard that the page mounted and nothing threw on the way down the column.
 */
const SECTION_IDS = [
	'basic',
	'minimal',
	'custom-styles',
	'slides-per-view',
	'align',
	'breakpoints',
	'navigation',
	'pagination',
	'controlled',
	'thumbnails',
	'auto-scroll',
	'loop',
	'flow',
	'flow-perf',
	'wheel',
	'drag-mode',
	'rtl',
	'product-cards',
	'link-cards',
	'custom-timeout',
	'loading',
	'lazy-mount',
	'a11y',
	'compare',
];

test.describe('smoke', () => {
	test('loads the playground and mounts the library', async ({page}) => {
		await page.goto('/');
		await expect(page.getByRole('heading', {level: 1})).toContainText(
			'carousel',
		);
		/** The first carousel actually rendered its slides through the library. */
		await expect(
			page.locator('#basic').getByText('Air Runner Pro'),
		).toBeVisible();
	});

	test('renders every demo section', async ({page}) => {
		await page.goto('/');
		for (const id of SECTION_IDS) {
			await expect(page.locator(`#${id}`)).toHaveCount(1);
		}
	});

	/**
	 * Consoles keep logging while the reader is elsewhere on the page (auto-scroll demos fire
	 * on their own); their box must not grow with entries, or everything below shifts.
	 */
	test('logging events does not change a console height', async ({page}) => {
		await page.goto('/');
		const section = page.locator('#navigation');
		await section.scrollIntoViewIfNeeded();

		/** The console root is the grandparent of its "events" titlebar label. */
		const consoleRoot = section
			.getByText('events', {exact: true})
			.first()
			.locator('../..');
		const empty = await consoleRoot.boundingBox();
		if (!empty) throw new Error('console has no bounding box');

		/** Each arrow click logs two events (nav + slide) — plenty to grow a min-height box. */
		await section.getByRole('button', {name: 'Next slide'}).first().click();
		await section.getByRole('button', {name: 'Next slide'}).first().click();
		await expect(section.getByText(/right · 1 → 2/).first()).toBeVisible();

		const filled = await consoleRoot.boundingBox();
		if (!filled) throw new Error('console has no bounding box');
		expect(filled.height).toBeCloseTo(empty.height, 0);
	});
});
