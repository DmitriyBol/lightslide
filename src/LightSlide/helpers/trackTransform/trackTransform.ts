import type {LightSlideStore} from '../store';

/**
 * The track's transform string for a logical px offset — the ONE place the offset meets the
 * screen. Every write site (snap, drag, free, flow) routes through it, so the reading
 * direction and the scroll axis are applied exactly once: offsets grow toward the content's
 * far edge, which is translate-negative in ltr (and on the vertical axis, where dirSign is
 * always 1) and translateX-positive in rtl (the browser already mirrors the flex layout; the
 * sign is all that's left). Lives apart from the trackOffset math so the flow entry — which
 * never computes a boundary offset — doesn't carry that chunk.
 */
export function trackTransform(
	offset: number,
	{dirSign, vertical}: Pick<LightSlideStore, 'dirSign' | 'vertical'>,
): string {
	return `translate${vertical ? 'Y' : 'X'}(${-offset * dirSign}px)`;
}
