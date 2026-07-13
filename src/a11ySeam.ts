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
 */
export type A11yContextType = {
	// The outer carousel element — keyboard binds its listener here.
	containerRef: RefObject<HTMLDivElement>;
	// The slides track — focus-guarding walks its slide children.
	trackRef: RefObject<HTMLDivElement>;
	// The imperative core-data store (currentIndex, slidesPerView, loopOffset, …).
	storeRef: MutableRefObject<LightSlideStore>;
	currentIndex: number;
	slideCount: number;
	maxIndex: number;
	isLoop: boolean;
	// True while flow or auto-scroll is running — the live region goes quiet (aria-live off) so
	// automatic movement doesn't spam the screen reader.
	autoMotion: boolean;
	goToIndex: (index: number, source: 'button' | 'pagination') => void;
	// Lets the reduced-motion plugin switch off auto-motion (flow / auto-scroll) reactively.
	setMotionAllowed: (allowed: boolean) => void;
};

export const A11yContext = createContext<A11yContextType | null>(null);

// Plugins must be rendered inside <LightSlide a11y={…}>; using one anywhere else is a wiring bug,
// so fail loudly rather than silently no-op.
export function useA11yContext(): A11yContextType {
	const ctx = useContext(A11yContext);
	if (!ctx) {
		throw new Error(
			'lightslide/a11y components must be passed to <LightSlide a11y={…}>',
		);
	}
	return ctx;
}
