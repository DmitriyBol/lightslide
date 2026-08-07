import {useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {SNAP_DURATION_MS, SNAP_EASING} from '../../LightSlide/helpers/constants';
import type {LightSlideStore} from '../../LightSlide/helpers/store';
import {useIsomorphicLayoutEffect} from '../../LightSlide/helpers/useIsomorphicLayoutEffect/useIsomorphicLayoutEffect';
import {prefersReducedMotion} from '../../utils/reducedMotion/reducedMotion';

type AutoHeightParams = {
	enabled: boolean;
	currentIndex: number;
	viewportRef: RefObject<HTMLDivElement | null>;
	trackRef: RefObject<HTMLDivElement | null>;
	storeRef: MutableRefObject<LightSlideStore>;
};

/**
 * Sizes the clipping viewport to the active slide's measured height and animates the change
 * with the snap's own duration/easing, so the height settles in step with the slide change.
 * The track is a flex row whose default cross-axis stretch would make every slide exactly as
 * tall as the tallest one — the measure would never see a natural height — so while engaged
 * the track gets `align-items: flex-start` and each slide keeps (and reports) its own.
 * The active element is the track child at `loopOffset + currentIndex` — always a real slide
 * (never a clone), and always mounted (the lazyMount window contains the active index), so
 * its `offsetHeight` is the true content height. A ResizeObserver keeps the height honest
 * between navigations: it watches the active slide (its content growing or shrinking — an
 * image loading, text expanding) and the track (viewport resizes reflow every slide; a
 * rebuilt strip swaps the children out from under the slide observer). Layout effect, so the
 * very first height — and the instant re-measure on hydration — lands before paint.
 *
 * The first application after (re-)engaging is deliberately instant: the server paints the
 * natural (tallest-slide) height, and animating the initial correction would turn that
 * one-off adjustment into a visible collapse on every load. Reduced motion snaps every
 * height change instantly, mirroring the track snap. While `enabled` is off (flow running,
 * vertical axis, loading) the inline height and transition are cleared — the viewport
 * returns to the default tallest-slide box — and unmounting the plugin restores it too.
 */
export function useAutoHeight({
	enabled,
	currentIndex,
	viewportRef,
	trackRef,
	storeRef,
}: AutoHeightParams): void {
	/** False until a height has landed — that first application must not animate. */
	const hasMeasuredRef = useRef(false);

	useIsomorphicLayoutEffect(() => {
		const viewport = viewportRef.current;
		const track = trackRef.current;
		if (!viewport) return undefined;
		if (!enabled || !track) {
			hasMeasuredRef.current = false;
			viewport.style.height = '';
			viewport.style.transition = '';
			if (track) track.style.alignItems = '';
			return undefined;
		}

		track.style.alignItems = 'flex-start';

		const applyHeight = () => {
			const {currentIndex: index, loopOffset} = storeRef.current;
			const slide = track.children[loopOffset + index];
			if (!(slide instanceof HTMLElement)) return;
			viewport.style.transition =
				hasMeasuredRef.current && !prefersReducedMotion()
					? `height ${SNAP_DURATION_MS}ms ${SNAP_EASING}`
					: '';
			viewport.style.height = `${slide.offsetHeight}px`;
			hasMeasuredRef.current = true;
		};

		applyHeight();

		const resizeObserver = new ResizeObserver(applyHeight);
		resizeObserver.observe(track);
		const slide = track.children[storeRef.current.loopOffset + currentIndex];
		if (slide) resizeObserver.observe(slide);
		return () => resizeObserver.disconnect();
	}, [enabled, currentIndex, viewportRef, trackRef, storeRef]);

	/**
	 * Unmount-only cleanup — per-navigation cleanups must not clear a mid-animation height.
	 * Layout-timed so a full re-run (dev HMR remounts every effect) clears before the main
	 * effect re-applies, never after it.
	 */
	useIsomorphicLayoutEffect(
		() => () => {
			const viewport = viewportRef.current;
			if (viewport) {
				viewport.style.height = '';
				viewport.style.transition = '';
			}
			const track = trackRef.current;
			if (track) track.style.alignItems = '';
		},
		[viewportRef, trackRef],
	);
}
