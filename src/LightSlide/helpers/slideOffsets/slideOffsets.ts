/**
 * Pure geometry for the variable-width (`slidesPerView: 'auto'`) mode: turns a list of measured
 * main-axis slide sizes into the cumulative leading-edge array the store carries as
 * `slideOffsets`, and derives the last reachable scroll position from it. Fixed (uniform-width)
 * mode never calls in here — it keeps the linear `visualIndex × stride` math in trackOffset.
 */

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
