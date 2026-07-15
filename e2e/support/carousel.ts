import type {Locator, Page} from '@playwright/test';

/**
 * A single LightSlide instance inside a playground demo section. Some sections render two
 * carousels (e.g. #navigation, #pagination), so every control is addressed by its `index` within
 * the section — index 0 is the first carousel, the default these specs use.
 *
 * Selectors lean only on the roles/aria the library actually emits (it ships no test ids): nav
 * arrows expose `aria-label="Previous slide"` / `"Next slide"`, pagination dots
 * `aria-label="Go to slide N"` with `aria-current="true"` on the active one. CSS-module class
 * names are short/hashed for bundle size and are never used as hooks.
 */
export type Carousel = ReturnType<typeof carousel>;

export function carousel(page: Page, sectionId: string, index = 0) {
	const section = page.locator(`#${sectionId}`);

	return {
		section,
		/**
		 * Prev/next arrows. Default and custom-rendered buttons both carry the same aria-label,
		 * so this matches either.
		 */
		prev: section.getByRole('button', {name: 'Previous slide'}).nth(index),
		next: section.getByRole('button', {name: 'Next slide'}).nth(index),
		/** Pagination dot for a 1-based position, plus the currently active dot. */
		dot: (position: number): Locator =>
			section
				.getByRole('button', {name: `Go to slide ${position}`})
				.nth(index),
		activeDot: section.locator('[aria-current="true"]').nth(index),
		/**
		 * The drag surface: the card tile holding `label` (the label span's parent). Dragging over
		 * a slide is what drives the real pointer gesture jsdom can't reach.
		 */
		card: (label: string): Locator =>
			section.getByText(label, {exact: true}).locator('..'),
		/**
		 * A logged analytics row in this section's <Console>. onEvent payloads render as text like
		 * "0 → 1 (right)", so we just assert the substring shows up.
		 */
		event: (text: string | RegExp): Locator => section.getByText(text),
	};
}
