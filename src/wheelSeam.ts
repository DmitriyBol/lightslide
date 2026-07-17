import {createContext, useContext} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {NavigateFn} from './LightSlide/helpers/navigation';
import type {LightSlideStore} from './LightSlide/helpers/store';

/**
 * The seam the opt-in `lightslide/wheel` plugin binds to. The core computes `active` (more
 * than one position, not loading) and hands over the container (where the plugin binds its
 * native wheel listener), the imperative store, and the single navigation path; the plugin
 * turns horizontal wheel/trackpad deltas into page turns — or, while flow runs, into drift
 * through the store's wheel mailbox. Lives in its own module so it is the single chunk shared
 * between the base and the wheel entry — a duplicated context would silently fail to match
 * Provider ↔ consumer.
 */
export type WheelSeamValue = {
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	active: boolean;
	goToIndex: NavigateFn;
};

export const WheelContext = createContext<WheelSeamValue | null>(null);

/**
 * Using the plugin outside <LightSlide wheel={…}> is a wiring bug — fail loudly. The full
 * message is dev-only; production builds throw the short marker.
 */
export function useWheelSeam(): WheelSeamValue {
	const ctx = useContext(WheelContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/wheel must be passed to <LightSlide wheel={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
