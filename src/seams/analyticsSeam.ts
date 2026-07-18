import {createContext, useContext} from 'react';

import type {MutableRefObject, ReactNode, RefObject} from 'react';

import type {LightSlideStore} from '../LightSlide/helpers/store';

/**
 * The seam the opt-in `lightslide/analytics` plugin binds to. The core hands over the
 * container (the IntersectionObserver target), the imperative store (the plugin assigns
 * `store.emitNav` to receive every navigation), and the raw slide children (the plugin reads
 * each `<Slide data={…}>` off them for the event payloads). Everything event-shaped — the
 * payload objects, viewed tracking, the viewport/terminal lifecycle — lives in the plugin,
 * so bundles that never import `lightslide/analytics` pay nothing for it. Lives in its own
 * module so it is the single chunk shared between the base and the analytics entry — a
 * duplicated context would silently fail to match Provider ↔ consumer.
 */
export type AnalyticsSeamValue = {
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	slides: ReactNode[];
};

export const AnalyticsContext = createContext<AnalyticsSeamValue | null>(null);

/**
 * Using the plugin outside <LightSlide analytics={…}> is a wiring bug — fail loudly. The
 * full message is dev-only; production builds throw the short marker.
 */
export function useAnalyticsSeam(): AnalyticsSeamValue {
	const ctx = useContext(AnalyticsContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/analytics must be passed to <LightSlide analytics={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
