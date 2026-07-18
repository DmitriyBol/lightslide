import {createContext, useContext} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {NavigateFn} from '../LightSlide/helpers/navigation';
import type {LightSlideStore} from '../LightSlide/helpers/store';

/**
 * The seam the opt-in `lightslide/autoplay` plugin binds to. The core computes `active`
 * (more than one position, not loading, motion allowed, and no flow — the flow ticker
 * supersedes interval cycling) and hands over the container (where the plugin binds its
 * hover/focus pause listeners), the imperative store (pause flags), and the single
 * navigation path. Lives in its own module so it is the single chunk shared between the
 * base and the autoplay entry — a duplicated context would silently fail to match
 * Provider ↔ consumer.
 */
export type AutoplaySeamValue = {
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	active: boolean;
	goToIndex: NavigateFn;
};

export const AutoplayContext = createContext<AutoplaySeamValue | null>(null);

/**
 * Using the plugin outside <LightSlide autoplay={…}> is a wiring bug — fail loudly. The
 * full message is dev-only; production builds throw the short marker.
 */
export function useAutoplaySeam(): AutoplaySeamValue {
	const ctx = useContext(AutoplayContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/autoplay must be passed to <LightSlide autoplay={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
