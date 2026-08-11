import {createContext, useContext} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from '../LightSlide/helpers/store';

/**
 * The seam the opt-in `lightslide/fade` plugin binds to. The core computes `active` (more
 * than one position, not loading, and no flow — a continuous ticker has no discrete slide
 * change to crossfade) and hands over the track (whose children the plugin stacks and
 * fades) and the imperative store (the visual-index math — the active child sits at
 * `loopOffset + currentIndex`). The navigation signal the fade re-runs on comes from
 * NavContext — the plugin reads `currentIndex` there, exactly as Navigation/Pagination do,
 * so this value stays fully stable. Lives in its own module so it is the single chunk
 * shared between the base and the fade entry — a duplicated context would silently fail to
 * match Provider ↔ consumer.
 */
export type FadeSeamValue = {
	trackRef: RefObject<HTMLDivElement | null>;
	storeRef: MutableRefObject<LightSlideStore>;
	active: boolean;
};

export const FadeContext = createContext<FadeSeamValue | null>(null);

/**
 * Using the plugin outside <LightSlide fade={…}> is a wiring bug — fail loudly. The full
 * message is dev-only; production builds throw the short marker.
 */
export function useFadeSeam(): FadeSeamValue {
	const ctx = useContext(FadeContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/fade must be passed to <LightSlide fade={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
