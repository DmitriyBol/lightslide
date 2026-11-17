import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';
import {scrollToRest} from './support/motion';

/**
 * #auto-scroll: an autoplay carousel whose <Pagination progress> mounts while autoplay is
 * enabled — the countdown ring on the active dot. The ring is pure CSS fed by the
 * --ls-autoplay-* variables the autoplay module publishes on the container, so everything
 * here is asserted through computed styles and structure, never pixel screenshots: the arc's
 * animation duration follows the interval knob, every pause source (hover, the APG pause
 * button) freezes it via animation-play-state, turning autoplay off drops the ring entirely,
 * and manual navigation remounts it on the newly active dot (a fresh cycle).
 */
test.describe('animated pagination (countdown ring)', () => {
	test('the active dot carries a ring timed to the autoplay interval', async ({
		page,
	}) => {
		await page.goto('/#auto-scroll');
		const c = carousel(page, 'auto-scroll');
		await c.root.scrollIntoViewIfNeeded();

		/** Default interval is 2000 ms. */
		await expect(c.activeDot.locator('svg')).toBeVisible();
		expect(await c.activeDot.locator('svg circle').last().evaluate(el => {
			return getComputedStyle(el).animationDuration;
		})).toBe('2s');

		/** Switching to the 4s knob remounts the carousel (key change) — the ring retimes. */
		await c.section.getByRole('button', {name: '4s', exact: true}).click();
		await expect(c.activeDot.locator('svg')).toBeVisible();
		expect(await c.activeDot.locator('svg circle').last().evaluate(el => {
			return getComputedStyle(el).animationDuration;
		})).toBe('4s');
	});

	test('hovering freezes the arc; leaving resumes it', async ({page}) => {
		await page.goto('/#auto-scroll');
		const c = carousel(page, 'auto-scroll');
		await scrollToRest(c.root);

		const playState = () =>
			c.activeDot.locator('svg circle').last().evaluate(el => {
				return getComputedStyle(el).animationPlayState;
			});

		await c.root.hover();
		await expect.poll(playState).toBe('paused');

		await page.mouse.move(0, 0);
		await expect.poll(playState).toBe('running');
	});

	test('the APG pause button freezes the arc, resume continues it', async ({page}) => {
		await page.goto('/#auto-scroll');
		const c = carousel(page, 'auto-scroll');
		await c.root.scrollIntoViewIfNeeded();

		const playState = () =>
			c.activeDot.locator('svg circle').last().evaluate(el => {
				return getComputedStyle(el).animationPlayState;
			});

		await c.section.getByRole('button', {name: 'pause()'}).click();
		await expect.poll(playState).toBe('paused');

		await c.section.getByRole('button', {name: 'resume()'}).click();
		await expect.poll(playState).toBe('running');
	});

	test('turning autoplay off reverts the dots to plain', async ({page}) => {
		await page.goto('/#auto-scroll');
		const c = carousel(page, 'auto-scroll');
		await c.root.scrollIntoViewIfNeeded();

		await expect(c.activeDot.locator('svg')).toBeVisible();

		await c.section.getByRole('switch', {name: 'autoplay'}).click();
		/** The carousel remounts without the autoplay slot — progress goes with it. */
		await expect(c.activeDot.locator('svg')).toHaveCount(0);
	});

	test('manual navigation moves the ring onto the new active dot', async ({page}) => {
		await page.goto('/#auto-scroll');
		const c = carousel(page, 'auto-scroll');
		await c.root.scrollIntoViewIfNeeded();

		await c.dot(3).click();
		await expect(c.activeDot).toHaveAccessibleName('Go to slide 3');
		/** The ring remounts on the newly active dot — the cycle restarted. */
		await expect(c.activeDot.locator('svg')).toBeVisible();
		await expect(c.dot(1).locator('svg')).toHaveCount(0);
	});

	test('reduced motion hides the ring entirely', async ({page}) => {
		await page.emulateMedia({reducedMotion: 'reduce'});
		await page.goto('/#auto-scroll');
		const c = carousel(page, 'auto-scroll');
		await c.root.scrollIntoViewIfNeeded();

		/** The svg may exist in the tree, but the media query switches it off. */
		await expect
			.poll(async () =>
				c.activeDot.locator('svg').evaluate(el => {
					return getComputedStyle(el).display;
				}),
			)
			.toBe('none');
	});
});
