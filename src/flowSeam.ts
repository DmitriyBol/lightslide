import {createContext, useContext} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from './LightSlide/helpers/store';
import type {PointerHandlers} from './LightSlide/helpers/usePointerGesture';

/**
 * The seam the opt-in `lightslide/flow` plugin binds to. The core computes `active` (a flow
 * node is present, there is more than one position, not loading, motion allowed) and owns the
 * track; the plugin runs the drift and hands its pointer handlers back through
 * `setPointerHandlers`, which the core spreads onto the viewport while active. Lives in its own
 * module so it is the single chunk shared between the base and the flow entry — a duplicated
 * context would silently fail to match Provider ↔ consumer.
 */
export type FlowSeamValue = {
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	active: boolean;
	setPointerHandlers: (handlers: PointerHandlers | null) => void;
};

export const FlowContext = createContext<FlowSeamValue | null>(null);

/**
 * Using the plugin outside <LightSlide flow={…}> is a wiring bug — fail loudly. The full
 * message is dev-only; production builds throw the short marker.
 */
export function useFlowSeam(): FlowSeamValue {
	const ctx = useContext(FlowContext);
	if (!ctx) {
		throw new Error(
			process.env.NODE_ENV !== 'production'
				? 'lightslide/flow must be passed to <LightSlide flow={…}>'
				: 'lightslide seam',
		);
	}
	return ctx;
}
