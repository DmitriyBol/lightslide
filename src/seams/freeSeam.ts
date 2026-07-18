import {createContext, useContext} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {NavigateFn} from '../LightSlide/helpers/navigation';
import type {LightSlideStore} from '../LightSlide/helpers/store';
import type {PointerHandlers} from '../LightSlide/helpers/usePointerGesture/usePointerGesture';

/**
 * The seam the opt-in `lightslide/free` plugin binds to. The core hands over the track, the
 * store, `active` (more than one position, not loading), and the single navigation path
 * (`goToIndex` — the plugin commits coast settles and edge snap-backs through it); the plugin
 * hands its pointer handlers back through `setPointerHandlers`, which the core spreads onto
 * the viewport in place of the built-in drag-to-snap gesture (the flow plugin, when present
 * and running, still wins). Lives in its own module so it is the single chunk shared between
 * the base and the free entry — a duplicated context would silently fail to match
 * Provider ↔ consumer.
 */
export type FreeSeamValue = {
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	active: boolean;
	goToIndex: NavigateFn;
	setPointerHandlers: (handlers: PointerHandlers | null) => void;
};

export const FreeContext = createContext<FreeSeamValue | null>(null);

/**
 * Using the plugin outside <LightSlide free={…}> is a wiring bug — fail loudly. The full
 * message is dev-only; production builds throw the short marker.
 */
export function useFreeSeam(): FreeSeamValue {
	const ctx = useContext(FreeContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/free must be passed to <LightSlide free={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
