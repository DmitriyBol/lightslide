import {createContext, useContext} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from '../LightSlide/helpers/store';

/**
 * The seam the opt-in `lightslide/autoheight` plugin binds to. The core computes `active`
 * (more than one position, not loading, horizontal axis, and no flow — continuous motion has
 * no discrete active slide to size against, and a vertical viewport's height is the layout
 * input, never the output) and hands over the viewport (whose height the plugin sets), the
 * track (whose children it measures), and the imperative store (the visual-index math). The
 * navigation signal the height effect re-runs on comes from NavContext — the plugin reads
 * `currentIndex` there, exactly as Navigation/Pagination do, so this value stays fully
 * stable. Lives in its own module so it is the single chunk shared between the base and the
 * autoheight entry — a duplicated context would silently fail to match Provider ↔ consumer.
 */
export type AutoHeightSeamValue = {
	viewportRef: RefObject<HTMLDivElement | null>;
	trackRef: RefObject<HTMLDivElement | null>;
	storeRef: MutableRefObject<LightSlideStore>;
	active: boolean;
};

export const AutoHeightContext = createContext<AutoHeightSeamValue | null>(
	null,
);

/**
 * Using the plugin outside <LightSlide autoHeight={…}> is a wiring bug — fail loudly. The
 * full message is dev-only; production builds throw the short marker.
 */
export function useAutoHeightSeam(): AutoHeightSeamValue {
	const ctx = useContext(AutoHeightContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/autoheight must be passed to <LightSlide autoHeight={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
