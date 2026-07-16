import {DEFAULT_WHEEL_THRESHOLD} from '../../LightSlide/helpers/constants';
import {useWheel} from '../../LightSlide/helpers/useWheel';
import {useWheelSeam} from '../../wheelSeam';

/**
 * `threshold` — accumulated horizontal wheel px before a page turn commits (default 30).
 * Lower is snappier, higher filters out grazing diagonal scrolls.
 */
export type WheelProps = {
	threshold?: number;
};

/**
 * Opt-in wheel/trackpad gestures — pass `wheel={<Wheel />}`. A horizontal trackpad swipe (or
 * shift+wheel on a mouse) turns one page per gesture, wrapping when `isLoop` is on; while
 * `flow` runs the same gesture drifts the strip instead. Vertical scrolling over the carousel
 * is never intercepted, so the page keeps scrolling naturally. Renders nothing — it binds a
 * wheel listener through the seam, and bundles that never import `lightslide/wheel` pay
 * nothing for it.
 */
export function Wheel({threshold = DEFAULT_WHEEL_THRESHOLD}: WheelProps) {
	const {containerRef, storeRef, active, goToIndex} = useWheelSeam();

	useWheel({
		enabled: active,
		threshold,
		containerRef,
		storeRef,
		navigate: goToIndex,
	});

	return null;
}
