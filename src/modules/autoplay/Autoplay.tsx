import {useHoverFocus} from '../../LightSlide/helpers/useHoverFocus/useHoverFocus';
import {useAutoplaySeam} from '../../seams/autoplaySeam';
import {useAutoScroll} from './useAutoScroll';

/**
 * `interval` — ms between automatic slide advances. `pauseOnHover` / `pauseOnFocus`
 * (default true) hold the cycling while the pointer is over the carousel or keyboard focus
 * is inside it, resuming when it leaves — the WAI-ARIA APG carousel behaviour; set to false
 * to opt out.
 */
export type AutoplayProps = {
	interval: number;
	pauseOnHover?: boolean;
	pauseOnFocus?: boolean;
};

/**
 * Opt-in automatic slide cycling — pass `autoplay={<Autoplay interval={5000} />}` (or
 * conditionally, `autoplay={playing ? <Autoplay interval={5000} /> : undefined}`, to toggle
 * it). Renders nothing: it runs the interval and the hover/focus pause listeners through the
 * seam. The flow ticker supersedes it, the a11y ReducedMotion plugin gates it, and the ref
 * handle's pause()/resume() holds it — all through the core's store flags. Bundles that never
 * import `lightslide/autoplay` pay nothing for it.
 */
export function Autoplay({
	interval,
	pauseOnHover = true,
	pauseOnFocus = true,
}: AutoplayProps) {
	const {containerRef, storeRef, active, goToIndex} = useAutoplaySeam();

	useHoverFocus({enabled: active, containerRef, storeRef});

	useAutoScroll({
		enabled: active,
		interval,
		pauseOnHover,
		pauseOnFocus,
		storeRef,
		goToIndex,
	});

	return null;
}
