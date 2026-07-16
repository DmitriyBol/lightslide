import {useLayoutEffect} from 'react';

import {useFreeSeam} from '../freeSeam';
import {useFreeDrag} from '../LightSlide/helpers/useFreeDrag';

/**
 * `snap` picks the free-snap variant: the coast travels the same distance but lands on the
 * nearest slide boundary instead of resting anywhere.
 */
export type FreeScrollProps = {
	snap?: boolean;
};

/**
 * Momentum ("free") drag scrolling. Presence turns the mode on — pass
 * `free={<FreeScroll />}` and a flick coasts with native-feel inertia, resting anywhere
 * (the nearest slide becomes the active index once it settles); `free={<FreeScroll snap />}`
 * coasts the same distance but lands on a slide boundary. The plugin hands its pointer
 * handlers to the core through the free seam, replacing the built-in drag-to-snap gesture,
 * so bundles that never import `lightslide/free` pay nothing for the physics. While a flow
 * plugin runs it owns the track and free scrolling stands by.
 */
export function FreeScroll({snap = false}: FreeScrollProps) {
	const {trackRef, storeRef, active, goToIndex, setPointerHandlers} =
		useFreeSeam();

	const handlers = useFreeDrag({snap, trackRef, storeRef, goToIndex});

	useLayoutEffect(() => {
		if (!active) return;
		setPointerHandlers(handlers);
		return () => setPointerHandlers(null);
	}, [active, handlers, setPointerHandlers]);

	return null;
}
