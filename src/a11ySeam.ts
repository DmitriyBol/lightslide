import {createContext, useContext} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from './LightSlide/helpers/store';

/**
 * The seam the opt-in `lightslide/a11y` plugins bind to.
 *
 * It is deliberately thin: the core always creates the context (cheap) but only renders a Provider
 * when the consumer passes an `a11y` node, so base consumers who never import the layer pay nothing
 * beyond the context object itself. The plugins read refs + nav state from here and drive the DOM
 * imperatively (keydown, inert, a live region) — the same imperative style the core uses.
 *
 * Lives in its own module so it is the single chunk shared between the base and the `a11y` entry;
 * that keeps the runtime context a single instance across the two bundles (a duplicated context
 * would silently fail to match Provider ↔ consumer).
 *
 * Most fields are refs or plain nav state; the non-obvious ones: `containerRef` is where keyboard
 * binds its listener, `trackRef`'s children are what focus-guarding walks, `storeRef` is the
 * imperative core store, `slidesPerView` gives focus-guarding its visible range, `autoMotion` is
 * true while flow / auto-scroll runs (the live region falls silent then), `isFlow` is true only
 * while the flow ticker runs (there is no discrete position then, so focus-guarding suspends),
 * and `setMotionAllowed` lets the reduced-motion plugin stop auto-motion reactively.
 */
export type A11yContextType = {
	containerRef: RefObject<HTMLDivElement>;
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	currentIndex: number;
	slideCount: number;
	maxIndex: number;
	slidesPerView: number;
	isLoop: boolean;
	isFlow: boolean;
	autoMotion: boolean;
	goToIndex: (index: number, source: 'button' | 'pagination') => void;
	setMotionAllowed: (allowed: boolean) => void;
};

export const A11yContext = createContext<A11yContextType | null>(null);

/**
 * Plugins must be rendered inside <LightSlide a11y={…}>; using one anywhere else is a wiring bug,
 * so fail loudly rather than silently no-op. The full message is dev-only — consumer bundlers
 * substitute NODE_ENV and drop the long literal from production builds.
 */
export function useA11yContext(): A11yContextType {
	const ctx = useContext(A11yContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/a11y components must be passed to <LightSlide a11y={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
