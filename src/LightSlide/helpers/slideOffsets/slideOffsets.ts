import type {LightSlideStore} from '../store';

/**
 * Pure geometry for the variable-width (`slidesPerView: 'auto'`) mode: turns a list of measured
 * main-axis slide sizes into the cumulative leading-edge array the store carries as
 * `slideOffsets`, derives the last reachable scroll position from it, and resolves the loop's
 * home/span. The store-reading helpers fall back to the uniform `stride` math, so fixed mode
 * keeps its exact linear arithmetic.
 */

/**
 * The px leading edge of `visualIndex` — a clamped lookup, so an out-of-range index pins to the
 * first/last edge rather than reading past the array.
 */
export function offsetAt(offsets: number[], visualIndex: number): number {
	const last = offsets.length - 1;
	const i = visualIndex < 0 ? 0 : visualIndex > last ? last : visualIndex;
	return offsets[i];
}

/**
 * The cumulative leading-edge px of each slide in a strip, given their measured sizes and the
 * gap between them. Length is `sizes.length + 1`: entry `i` is the leading edge of slide `i`
 * (the sum of every earlier size plus the gap that precedes it), and the final entry carries a
 * trailing gap — so the real content width is `last − gap`, exactly the value trackOffset's
 * flush clamp subtracts. Under uniform sizes every entry equals `i × (size + gap)`, matching the
 * fixed-mode stride so the two paths agree.
 */
export function buildSlideOffsets(sizes: number[], gap: number): number[] {
	const offsets = [0];
	for (let i = 0; i < sizes.length; i++) {
		offsets.push(offsets[i] + sizes[i] + gap);
	}
	return offsets;
}

/**
 * The last reachable scroll index for a non-loop, start-aligned variable-width strip. Every
 * slide is a snap position, but the trailing slides that share the final viewport collapse to a
 * single flush position (Embla's containScroll behaviour): once a slide's leading edge reaches
 * the max track offset it rests flush and no later slide adds a new position. Returns the first
 * such index, or the last slide when the whole strip fits (max offset 0 → index 0).
 */
export function measuredMaxIndex(
	slideOffsets: number[],
	gap: number,
	viewportSize: number,
): number {
	const count = slideOffsets.length - 1;
	if (count <= 0) return 0;
	const maxOffset = Math.max(0, slideOffsets[count] - gap - viewportSize);
	for (let i = 0; i < count; i++) {
		if (slideOffsets[i] >= maxOffset) return i;
	}
	return count - 1;
}

/**
 * The px offset at which the loop rests "home" — the leading edge of the first real slide,
 * past the prepended clones. `loopOffset × stride` under uniform widths.
 */
export function loopHome(store: LightSlideStore): number {
	const {slideOffsets, loopOffset, slideWidth, gap} = store;
	if (!slideOffsets) return loopOffset * (slideWidth + gap);
	return offsetAt(slideOffsets, loopOffset);
}

/**
 * The px width of one full strip of real slides — the distance a loop wraps by.
 * `slideCount × stride` under uniform widths.
 */
export function contentSpan(store: LightSlideStore): number {
	const {slideOffsets, loopOffset, slideCount, slideWidth, gap} = store;
	if (!slideOffsets) return slideCount * (slideWidth + gap);
	return (
		offsetAt(slideOffsets, loopOffset + slideCount) -
		offsetAt(slideOffsets, loopOffset)
	);
}

/**
 * The visual index whose leading edge sits nearest `target` px — the variable-width snap
 * decision, replacing fixed mode's `round(offset / stride)`. Binary search for the first edge
 * at or past the target, then pick whichever of it and its predecessor is closer (ties go to
 * the earlier slide, matching a start-aligned rest). The caller subtracts loopOffset to get the
 * logical index and clamps/wraps it.
 */
export function nearestVisualIndex(
	slideOffsets: number[],
	target: number,
): number {
	const last = slideOffsets.length - 1;
	if (target <= slideOffsets[0]) return 0;
	if (target >= slideOffsets[last]) return last;
	let lo = 0;
	let hi = last;
	while (lo < hi) {
		const mid = Math.floor((lo + hi) / 2);
		if (slideOffsets[mid] < target) lo = mid + 1;
		else hi = mid;
	}
	const prev = lo - 1;
	return target - slideOffsets[prev] <= slideOffsets[lo] - target ? prev : lo;
}
