/**
 * The track's transform string for a logical px offset — the ONE place the offset meets the
 * screen. Every write site (snap, drag, free, flow) routes through it, so the reading
 * direction is applied exactly once: offsets grow toward the content's far edge, which is
 * translateX-negative in ltr and translateX-positive in rtl (the browser already mirrors the
 * flex layout; the sign is all that's left). Lives apart from the trackOffset math so the
 * flow entry — which never computes a boundary offset — doesn't carry that chunk.
 */
export function trackTransform(offset: number, dirSign: 1 | -1): string {
	return `translateX(${-offset * dirSign}px)`;
}
