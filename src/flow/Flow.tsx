import {useLayoutEffect} from 'react';

import {useFlowSeam} from '../flowSeam';
import {
	DEFAULT_FLOW_RESUME_DELAY,
	DEFAULT_FLOW_SPEED,
} from '../LightSlide/helpers/constants';
import {useFlow} from '../LightSlide/helpers/useFlow';

/**
 * Continuous-ticker tuning: `speed` in px per second (default 40), `resumeDelay` the pause in
 * ms after an interaction before the drift resumes (default 2000).
 */
export type FlowProps = {
	speed?: number;
	resumeDelay?: number;
};

/**
 * Continuous "flow"/ticker scrolling. Presence turns the mode on — pass
 * `flow={<Flow />}` (or conditionally, `flow={active ? <Flow /> : undefined}`); loop clones
 * are added automatically and interacting with the carousel pauses the drift. The plugin owns
 * the rAF loop and hands its pointer handlers to the core through the flow seam, so bundles
 * that never import `lightslide/flow` pay nothing for the ticker.
 */
export function Flow({
	speed = DEFAULT_FLOW_SPEED,
	resumeDelay = DEFAULT_FLOW_RESUME_DELAY,
}: FlowProps) {
	const {trackRef, storeRef, active, setPointerHandlers} = useFlowSeam();

	const handlers = useFlow({
		enabled: active,
		speed,
		resumeDelay,
		trackRef,
		storeRef,
	});

	useLayoutEffect(() => {
		setPointerHandlers(handlers);
		return () => setPointerHandlers(null);
	}, [handlers, setPointerHandlers]);

	return null;
}
