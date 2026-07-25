import type {LightSlideStore} from '../store';

/**
 * The px leading edge of `visualIndex` in the variable-width model — a clamped lookup into the
 * precomputed `slideOffsets` array. Indices are integers (logical + loopOffset); out-of-range
 * values pin to the first/last edge rather than reading past the array.
 */
function offsetAt(offsets: number[], visualIndex: number): number {
	const last = offsets.length - 1;
	const i = visualIndex < 0 ? 0 : visualIndex > last ? last : visualIndex;
	return offsets[i];
}

/**
 * The maximum scroll offset in px — content width minus viewport width. In fixed mode that is
 * `(slideCount − slidesPerView) × slideWidth + (slideCount − ceil(slidesPerView)) × gap`; with
 * variable widths (`slideOffsets` set) it is the measured content width (the last cumulative
 * edge, minus its trailing gap) minus the measured viewport. Non-loop offsets clamp to it
 * (trackOffset, the free-drag bounds); loop mode ignores it.
 */
export function maxTrackOffset(store: LightSlideStore): number {
	const {slideWidth, gap, slideCount, slidesPerView, slideOffsets, viewportSize} =
		store;
	if (slideOffsets) {
		const content = offsetAt(slideOffsets, slideOffsets.length - 1) - gap;
		return Math.max(0, content - viewportSize);
	}
	return Math.max(
		0,
		(slideCount - slidesPerView) * slideWidth +
			(slideCount - Math.ceil(slidesPerView)) * gap,
	);
}

/**
 * How many extra slides are (partially) visible LEFT of the active one in center mode —
 * derived from slidesPerView alone so render-time consumers (loop clone count, the lazyMount
 * window) can use it before anything is measured. The centring inset is
 * ((slidesPerView − 1) × slideWidth + visible gaps) / 2, i.e. at most
 * ceil((slidesPerView − 1) / 2) strides; at least 1 because any inset > 0 exposes a sliver
 * of the previous slide.
 */
export function centerLead(slidesPerView: number): number {
	return Math.max(1, Math.ceil((slidesPerView - 1) / 2));
}

/**
 * The px the track is translated (the caller negates it) to bring `visualIndex` to its
 * resting position — the viewport's left edge, or `centerInset` px inside it in center mode.
 * Positions step by the stride `slideWidth + gap`, or, with variable widths, come straight
 * from the measured `slideOffsets` array (same value under uniform widths).
 *
 * In non-loop mode the result is clamped to [0, maxTrackOffset]: a fractional
 * `slidesPerView` (e.g. 1.5) lands the final slide flush against the right edge instead of
 * cutting it off mid-slide, and center mode never scrolls past either edge (no blank
 * space) — the first and last positions rest flush, Embla's containScroll behaviour.
 * Without the max clamp, `maxIndex = ceil(slideCount - slidesPerView)` would over-translate
 * by the fractional remainder.
 *
 * Loop mode never clamps — its prepended/appended clones own the wrap-around, so synthetic
 * clone indices (e.g. `slideCount + loopOffset`) must map to a plain linear offset.
 *
 * For an integer `slidesPerView` at `align: 'start'` the clamps are no-ops: every reachable
 * visual index already maps inside [0, max], so the value is unchanged.
 */
export function trackOffset(
	visualIndex: number,
	store: LightSlideStore,
): number {
	const {slideWidth, gap, isLoop, centerInset, slideOffsets} = store;
	const linear = slideOffsets
		? offsetAt(slideOffsets, visualIndex)
		: visualIndex * (slideWidth + gap);
	const raw = linear - centerInset;
	if (isLoop) return raw;
	return Math.max(0, Math.min(raw, maxTrackOffset(store)));
}
