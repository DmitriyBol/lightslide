import type {LightSlideStore} from './store';

/**
 * The px the track is translated (the caller negates it) to bring `visualIndex` to the
 * viewport's left edge.
 *
 * In non-loop mode the result is clamped to the maximum scroll offset so a fractional
 * `slidesPerView` (e.g. 1.5) lands the final slide flush against the right edge instead of
 * cutting it off mid-slide. Without the clamp, `maxIndex = ceil(slideCount - slidesPerView)`
 * would over-translate by the fractional remainder; with it, the last reachable index settles
 * exactly at `(slideCount - slidesPerView) * slideWidth`.
 *
 * Loop mode never clamps — its prepended/appended clones own the wrap-around, so synthetic
 * clone indices (e.g. `slideCount + loopOffset`) must map to a plain linear offset.
 *
 * For an integer `slidesPerView` the clamp is a no-op: every reachable visual index is already
 * ≤ the max offset, so the value is unchanged.
 */
export function trackOffset(
	visualIndex: number,
	store: LightSlideStore,
): number {
	const {slideWidth, isLoop, slideCount, slidesPerView} = store;
	const raw = visualIndex * slideWidth;
	if (isLoop) return raw;
	const maxOffset = Math.max(0, slideCount - slidesPerView) * slideWidth;
	return Math.min(raw, maxOffset);
}
