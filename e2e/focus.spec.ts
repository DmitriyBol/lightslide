import {expect, test} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * Focus containment. The failure these guard against is the one every big carousel has an open
 * issue for: something inside an off-screen slide takes focus, the browser scrolls the clipping
 * viewport to reveal it, and the strip is left offset from the transform that is supposed to own
 * it — for the rest of the session. The core answer is `overflow: clip` (a viewport that cannot
 * scroll at all); the opt-in a11y layer's answer is `inert` plus handing focus back to the
 * carousel instead of letting the browser drop it on <body>.
 *
 * Off-screen slides are inert, which can drop their contents from the a11y tree, so focusable
 * slide content is addressed with CSS rather than by role.
 */

/**
 * The clipping box, without reaching for a hashed class name: a slide's grandparent is
 * slide → track → viewport.
 */
const viewportOf = (root: Locator) =>
	root.locator('[aria-roledescription="slide"]').first().locator('../..');

const scrollOf = (viewport: Locator) =>
	viewport.evaluate((el: Element) => el.scrollLeft + el.scrollTop);

const activeLabel = (page: Page) =>
	page.evaluate(() =>
		(document.activeElement?.textContent ?? '').trim().slice(0, 20),
	);

test.describe('focus containment', () => {
	test('activating a control in the peek slide does not scroll the viewport', async ({
		page,
	}) => {
		await page.goto('/#link-cards');
		const c = carousel(page, 'link-cards');
		await c.root.scrollIntoViewIfNeeded();
		const viewport = viewportOf(c.root);

		/** At slidesPerView 2.5 the third card is the half-visible peek — its button is clickable. */
		await c.section.locator('a[href$="/p/3"] button').click();
		expect(await scrollOf(viewport)).toBe(0);

		/**
		 * And the carousel still navigates from where it actually is: slide 2 lands flush against
		 * the viewport's left edge, which a viewport scrolled behind the transform's back could not.
		 */
		await c.next.click();
		await expect
			.poll(async () => {
				const slide = await c.section
					.getByRole('group', {name: '2 of 5'})
					.boundingBox();
				const box = await viewport.boundingBox();
				return slide && box ? Math.abs(slide.x - box.x) : Number.NaN;
			})
			.toBeLessThanOrEqual(2);
	});

	test('tabbing through slide content never scrolls the viewport', async ({
		page,
	}) => {
		await page.goto('/#link-cards');
		const c = carousel(page, 'link-cards');
		await c.root.scrollIntoViewIfNeeded();
		const viewport = viewportOf(c.root);

		await c.section.locator('a[href$="/p/1"]').focus();
		/** Enough hops to walk past the last visible card into the off-screen ones. */
		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');
			expect(await scrollOf(viewport)).toBe(0);
		}
	});

	test('arrow keys keep working when focus starts inside a slide', async ({
		page,
	}) => {
		await page.goto('/#a11y');
		const section = page.locator('#a11y');
		await section.scrollIntoViewIfNeeded();
		const region = section.getByRole('region', {name: 'Product highlights'});
		const activeDot = region.locator('[aria-current="true"]');

		await region.locator('a').first().focus();

		/**
		 * The first press guards the slide focus was in. Without the hand-off focus lands on
		 * <body>, the container's keydown listener stops hearing anything, and presses 2 and 3
		 * do nothing at all.
		 */
		for (const position of [2, 3, 4]) {
			await page.keyboard.press('ArrowRight');
			await expect(activeDot).toHaveAttribute(
				'aria-label',
				`Go to slide ${position}`,
			);
		}

		/** Focus stayed inside the carousel — that is what kept the listener alive. */
		expect(
			await region.evaluate((el: Element) =>
				el.contains(document.activeElement),
			),
		).toBe(true);
	});

	test('arrow keys move only the carousel that holds focus', async ({page}) => {
		await page.goto('/#a11y');
		const section = page.locator('#a11y');
		await section.scrollIntoViewIfNeeded();
		const first = section.getByRole('region', {name: 'Product highlights'});
		const second = section.getByRole('region', {name: 'Gallery — 3 up'});

		await second.getByRole('button', {name: 'Go to slide 1'}).focus();
		await page.keyboard.press('ArrowRight');

		await expect(second.locator('[aria-current="true"]')).toHaveAttribute(
			'aria-label',
			'Go to slide 2',
		);
		await expect(first.locator('[aria-current="true"]')).toHaveAttribute(
			'aria-label',
			'Go to slide 1',
		);
	});

	test('crossfading out the focused slide raises no aria-hidden warning', async ({
		page,
	}) => {
		const blocked: string[] = [];
		page.on('console', message => {
			if (/aria-hidden/i.test(message.text())) blocked.push(message.text());
		});

		await page.goto('/#fade');
		const c = carousel(page, 'fade');
		await c.root.scrollIntoViewIfNeeded();
		/**
		 * By attribute, not by role+name: once the slide is aria-hidden it leaves the a11y tree
		 * and its accessible name goes with it, so a role query stops matching it.
		 */
		const outgoing = c.section.locator('[aria-label="1 of 4"]');

		await outgoing.locator('a').focus();
		expect(await activeLabel(page)).toBe('Aurora');

		await c.next.click();

		/** inert lands before aria-hidden, so the browser has already moved focus out. */
		await expect(outgoing).toHaveAttribute('inert', '');
		await expect(outgoing).toHaveAttribute('aria-hidden', 'true');
		expect(
			await outgoing.evaluate((el: Element) =>
				el.contains(document.activeElement),
			),
		).toBe(false);
		expect(blocked).toEqual([]);
	});
});
