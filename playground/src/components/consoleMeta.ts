// Maps each event category to its terminal glyph, mono token label, and colour variable.
// Centralises what used to be ad-hoc emoji prefixes scattered across every example.

export type ConsoleCategory =
	| 'slide'
	| 'viewport'
	| 'end'
	| 'viewed'
	| 'nav'
	| 'pagination'
	| 'link'
	| 'cart'
	| 'info';

export type ConsoleEntry = {
	id: number;
	time: string;
	category: ConsoleCategory;
	payload: string;
};

export const CATEGORY: Record<
	ConsoleCategory,
	{glyph: string; token: string; color: string}
> = {
	slide: {glyph: '→', token: 'slide', color: 'var(--tok-slide)'},
	viewport: {glyph: '◎', token: 'in_viewport', color: 'var(--tok-viewport)'},
	end: {glyph: '■', token: 'reached_end', color: 'var(--tok-end)'},
	viewed: {glyph: '⏱', token: 'viewed_slides', color: 'var(--tok-viewed)'},
	nav: {glyph: '↳', token: 'nav_button', color: 'var(--tok-nav)'},
	pagination: {glyph: '↳', token: 'pagination', color: 'var(--tok-nav)'},
	link: {glyph: '→', token: 'link', color: 'var(--tok-slide)'},
	cart: {glyph: '↳', token: 'add_to_cart', color: 'var(--tok-viewport)'},
	info: {glyph: '·', token: 'info', color: 'var(--text-muted)'},
};
