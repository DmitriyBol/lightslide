import {expect, test} from '@playwright/test';

import {carousel} from './support/carousel';

/**
 * #controlled holds two carousels sharing one <Console>. The first is driven imperatively via
 * the ref handle (external prev()/next()/goTo(last) buttons + pagination dots + a position
 * readout fed by onIndexChange); the second is controlled through the `index` prop bound to a
 * segmented control, with onIndexChange closing the loop in the other direction.
 */
test.describe('external control', () => {
	test('ref handle buttons drive the carousel and onIndexChange reports back', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'controlled');
		const section = c.section;

		await expect(section.getByText('position 1 of 5')).toBeVisible();

		await section.getByRole('button', {name: 'next()'}).click();
		await expect(section.getByText('position 2 of 5')).toBeVisible();
		await expect(c.event(/onIndexChange → 1/).first()).toBeVisible();

		await section.getByRole('button', {name: 'prev()'}).click();
		await expect(section.getByText('position 1 of 5')).toBeVisible();

		await section.getByRole('button', {name: 'goTo(last)'}).click();
		await expect(section.getByText('position 5 of 5')).toBeVisible();
		/** The dots belong to the first carousel, so the active one mirrors the ref navigation. */
		await expect(c.dot(5)).toHaveAttribute('aria-current', 'true');
	});

	test('controlled index follows external state in both directions', async ({
		page,
	}) => {
		await page.goto('/');
		const c = carousel(page, 'controlled');
		const section = c.section;
		const segment = (label: string) =>
			section
				.getByRole('group', {name: 'Controlled index'})
				.getByRole('button', {name: label, exact: true});

		/**
		 * Segmented → carousel: picking "4" navigates the second carousel, whose next arrow
		 * then still has one position left before the edge.
		 */
		await segment('4').click();
		await expect(segment('4')).toHaveAttribute('aria-pressed', 'true');

		/** Carousel → segmented: the second carousel's own arrow moves external state too. */
		await c.next.click();
		await expect(segment('5')).toHaveAttribute('aria-pressed', 'true');
		await expect(c.next).toBeDisabled();
	});
});
