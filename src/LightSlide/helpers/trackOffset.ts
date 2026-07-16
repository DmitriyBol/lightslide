import type {LightSlideStore} from './store';

/**
 * The maximum scroll offset in px — content width minus viewport width, expressed in store
 * terms as `(slideCount − slidesPerView) × slideWidth + (slideCount − ceil(slidesPerView)) × gap`.
 * Non-loop offsets clamp to it (trackOffset, the free-drag bounds); loop mode ignores it.
 */
export function maxTrackOffset(store: LightSlideStore): number {
	const {slideWidth, gap, slideCount, slidesPerView} = store;
	return Math.max(
		0,
		(slideCount - slidesPerView) * slideWidth +
			(slideCount - Math.ceil(slidesPerView)) * gap,
	);
}

/**
 * The px the track is translated (the caller negates it) to bring `visualIndex` to the
 * viewport's left edge. Positions step by the stride `slideWidth + gap`.
 *
 * In non-loop mode the result is clamped to maxTrackOffset, so a fractional `slidesPerView`
 * (e.g. 1.5) lands the final slide flush against the right edge instead of cutting it off
 * mid-slide. Without the clamp, `maxIndex = ceil(slideCount - slidesPerView)` would
 * over-translate by the fractional remainder.
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
	const {slideWidth, gap, isLoop} = store;
	const raw = visualIndex * (slideWidth + gap);
	if (isLoop) return raw;
	return Math.min(raw, maxTrackOffset(store));
}
