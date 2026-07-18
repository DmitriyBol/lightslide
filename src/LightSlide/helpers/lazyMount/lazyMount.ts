import {centerLead} from '../trackOffset/trackOffset';

/** Default number of off-screen slides kept mounted on each side of the visible window. */
export const DEFAULT_LAZY_MARGIN = 1;

/**
 * Builds the per-slide mount predicate for the `lazyMount` prop: true for logical indices
 * inside `[visible start − margin, visible end + margin]`. All arguments are in logical
 * slide indices; `slidesPerView` is the effective (post-breakpoint) value. The visible
 * range is `currentIndex .. currentIndex + ceil(slidesPerView) − 1`, except at the last
 * position with a fractional slidesPerView (non-loop), where the flush clamp shifts the
 * leftmost visible slide to `slideCount − ceil(slidesPerView)` — the same clamp
 * trackOffset applies in pixels. Center mode shifts the window's left edge out by
 * centerLead — the slides peeking left of the active one must stay mounted. In loop mode
 * the window wraps modulo slideCount so edge windows cover the slides whose clones are on
 * screen; loop never flush-clamps. The wrap math relies on the padded window being
 * narrower than slideCount — wider ones exit through the covers-the-whole-strip branch
 * first.
 */
export function buildMountPredicate(
	currentIndex: number,
	slideCount: number,
	slidesPerView: number,
	maxIndex: number,
	isLoop: boolean,
	margin: number,
	centered: boolean,
): (index: number) => boolean {
	const visibleCount = Math.ceil(slidesPerView);
	const leftPad = margin + (centered ? centerLead(slidesPerView) : 0);

	if (isLoop) {
		const length = visibleCount + leftPad + margin;
		if (length >= slideCount) return () => true;
		const start = (currentIndex - leftPad + slideCount) % slideCount;
		return index => (index - start + slideCount) % slideCount < length;
	}

	const start = Math.max(
		0,
		(currentIndex === maxIndex
			? Math.min(currentIndex, slideCount - visibleCount)
			: currentIndex) - leftPad,
	);
	const end = currentIndex + visibleCount - 1 + margin;
	return index => index >= start && index <= end;
}
