import {useEffect} from 'react';

import {useA11yContext} from '../a11ySeam';

/**
 * Keeps the tab order in sync with what's on screen: real slides outside the visible window get
 * `inert`, so keyboard focus can't disappear onto an off-screen slide's links/buttons. Loop clones
 * are already inert (set by the core), so this only manages the real slides — and it touches
 * `inert` on nothing else, so it never fights React over an attribute the core owns.
 *
 * The visible window is [currentIndex, currentIndex + ⌈slidesPerView⌉ − 1] — ceil so a fractional
 * `slidesPerView` keeps its partially-visible peek slide interactive.
 */
export function FocusGuard() {
	const {trackRef, currentIndex, slideCount, slidesPerView, isLoop} =
		useA11yContext();

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;

		const loopOffset = isLoop ? Math.ceil(slidesPerView) : 0;
		const lastVisible = currentIndex + Math.ceil(slidesPerView) - 1;
		const {children} = track;

		// Maps a DOM child position back to its logical slide index (clones sit at <0 or ≥count).
		const realSlides: {el: HTMLElement; logical: number}[] = [];
		for (let dom = 0; dom < children.length; dom++) {
			const logical = dom - loopOffset;
			if (logical >= 0 && logical < slideCount) {
				realSlides.push({el: children[dom] as HTMLElement, logical});
			}
		}

		for (const {el, logical} of realSlides) {
			const visible = logical >= currentIndex && logical <= lastVisible;
			if (visible) el.removeAttribute('inert');
			else el.setAttribute('inert', '');
		}

		// Clear the guards we set when the plugin unmounts, so slides are interactive again.
		return () => {
			for (const {el} of realSlides) el.removeAttribute('inert');
		};
	}, [trackRef, currentIndex, slideCount, slidesPerView, isLoop]);

	return null;
}
