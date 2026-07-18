import {
	DEFAULT_FLOW_RESUME_DELAY,
	DEFAULT_FLOW_SPEED,
} from '../../LightSlide/helpers/constants';
import {useFlow} from '../../LightSlide/helpers/useFlow/useFlow';
import {useHoverFocus} from '../../LightSlide/helpers/useHoverFocus/useHoverFocus';
import {useIsomorphicLayoutEffect} from '../../LightSlide/helpers/useIsomorphicLayoutEffect/useIsomorphicLayoutEffect';
import {useFlowSeam} from '../../seams/flowSeam';

/**
 * Continuous-ticker tuning: `speed` in px per second (default 40), `resumeDelay` the pause in
 * ms after an interaction before the drift resumes (default 2000). `pauseOnHover` /
 * `pauseOnFocus` (default true) hold the drift while the pointer is over the carousel or
 * keyboard focus is inside it, resuming as soon as it leaves — the WAI-ARIA APG carousel
 * behaviour; set to false to opt out.
 */
export type FlowProps = {
	speed?: number;
	resumeDelay?: number;
	pauseOnHover?: boolean;
	pauseOnFocus?: boolean;
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
	pauseOnHover = true,
	pauseOnFocus = true,
}: FlowProps) {
	const {containerRef, trackRef, storeRef, active, setPointerHandlers} =
		useFlowSeam();

	/** The drift pauses on engagement per pauseOnHover/pauseOnFocus — the plugin mirrors it. */
	useHoverFocus({enabled: active, containerRef, storeRef});

	const handlers = useFlow({
		enabled: active,
		speed,
		resumeDelay,
		pauseOnHover,
		pauseOnFocus,
		trackRef,
		storeRef,
	});

	useIsomorphicLayoutEffect(() => {
		setPointerHandlers(handlers);
		return () => setPointerHandlers(null);
	}, [handlers, setPointerHandlers]);

	return null;
}
