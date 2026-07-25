import type {LightSlideStore} from '../store';

/**
 * The reading half of variable-width geometry (`slidesPerView: 'auto'`): resolves positions out
 * of the measured `store.slideOffsets` array — an edge by index, the loop's home and span, and
 * the boundary nearest a px offset. Every store-reading helper falls back to the uniform
 * `stride` math, so fixed mode keeps its exact linear arithmetic. The array is produced by
 * buildOffsets, which only the core imports.
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
