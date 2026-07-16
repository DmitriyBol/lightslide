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
	'breakpoints',
	'navigation',
	'pagination',
	'controlled',
	'auto-scroll',
	'loop',
	'flow',
	'flow-perf',
	'wheel',
	'product-cards',
	'link-cards',
	'custom-timeout',
	'loading',
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
});
