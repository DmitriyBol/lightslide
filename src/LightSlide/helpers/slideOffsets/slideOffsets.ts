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
