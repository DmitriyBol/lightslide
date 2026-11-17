import type {CSSProperties} from 'react';

/**
 * Pagination dots. dotStyle/dotClassName apply to every dot; activeDotStyle/activeDotClassName
 * merge on top for the active dot.
 */
export type PaginationProps = {
	style?: CSSProperties;
	className?: string;
	dotStyle?: CSSProperties;
	dotClassName?: string;
	activeDotStyle?: CSSProperties;
	activeDotClassName?: string;
	/**
	 * Draws a countdown ring around the active dot, driven by `<Autoplay>`'s interval: the arc
	 * drains clockwise and the advance fires as it empties. Pausing the autoplay (hover, focus,
	 * drag, or the ref handle) freezes the arc in place; manual navigation restarts it. Without
	 * an autoplay mounted the dots stay plain — the ring is pure CSS reading variables this
	 * module never imports, so tree-shaking is unaffected.
	 */
	progress?: boolean;
};
