import {useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from '../../LightSlide/helpers/store';
import {useIsomorphicLayoutEffect} from '../../LightSlide/helpers/useIsomorphicLayoutEffect/useIsomorphicLayoutEffect';

type FadeParams = {
	enabled: boolean;
	currentIndex: number;
	maxIndex: number;
	isLoop: boolean;
	trackRef: RefObject<HTMLDivElement | null>;
	storeRef: MutableRefObject<LightSlideStore>;
};

/** Clears every fade-owned inline style and ARIA patch from the real slides. */
function release(track: HTMLElement, store: LightSlideStore): void {
	const {loopOffset, slideCount} = store;
	for (let i = loopOffset; i < loopOffset + slideCount; i++) {
		const slide = track.children[i];
		if (!(slide instanceof HTMLElement)) continue;
		slide.style.opacity = '';
		slide.style.zIndex = '';
		slide.style.pointerEvents = '';
		slide.removeAttribute('aria-hidden');
		slide.removeAttribute('inert');
	}
}

/**
 * Flips which stacked slide is visible: the active child gets `opacity: 1` on top
 * (`z-index: 1`), every other real slide fades to 0 underneath and is taken out of the
 * page for every audience — `pointer-events: none` for the pointer, `aria-hidden` for the
 * accessibility tree, `inert` for sequential focus. The crossfade itself is CSS (the
 * plugin's injected stylesheet transitions `opacity`, honouring reduced motion), so this
 * effect only writes the target values; running layout-timed puts the very first
 * application before paint, where it matches the stylesheet's initial state — no flash and
 * nothing to animate on load. Only the real slides are touched: loop clones keep their
 * core-set `aria-hidden`/`inert`, and the frozen initial-visibility rule keeps them at
 * opacity 0 forever (a clone is never the active child). Writes go through the DOM, not
 * React state — the attributes survive re-renders because the core never manages them on
 * real slides — mirroring how useAutoHeight owns the viewport height.
 *
 * While `enabled` is off (flow running, loading, a single position) every fade-owned style
 * and attribute is cleared, and unmounting the plugin restores the slides too. `maxIndex`
 * and `isLoop` are re-run signals only: a changed slide set or a loop toggle rebuilds the
 * strip under the same index, so the stack must be re-stamped even though the values are
 * read fresh from the store.
 */
export function useFade({
	enabled,
	currentIndex,
	maxIndex,
	isLoop,
	trackRef,
	storeRef,
}: FadeParams): void {
	/** The geometry misuse warning fires once per mount, not once per navigation. */
	const warnedRef = useRef(false);

	useIsomorphicLayoutEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		if (!enabled) {
			release(track, storeRef.current);
			return;
		}

		if (process.env.NODE_ENV !== 'production' && !warnedRef.current) {
			const {slidesPerView, slideOffsets} = storeRef.current;
			if (slidesPerView !== 1 || slideOffsets !== null) {
				warnedRef.current = true;
				console.error(
					'lightslide/fade expects slidesPerView 1 — the slides stack in one place, so only the active slide is ever visible',
				);
			}
		}

		const {loopOffset, slideCount} = storeRef.current;
		const activeAt = loopOffset + currentIndex;
		for (let i = loopOffset; i < loopOffset + slideCount; i++) {
			const slide = track.children[i];
			if (!(slide instanceof HTMLElement)) continue;
			const isActive = i === activeAt;
			slide.style.opacity = isActive ? '1' : '0';
			slide.style.zIndex = isActive ? '1' : '0';
			slide.style.pointerEvents = isActive ? '' : 'none';
			slide.toggleAttribute('inert', !isActive);
			if (isActive) slide.removeAttribute('aria-hidden');
			else slide.setAttribute('aria-hidden', 'true');
		}
	}, [enabled, currentIndex, maxIndex, isLoop, trackRef, storeRef]);

	/**
	 * Unmount-only cleanup — layout-timed so a full re-run (dev HMR remounts every effect)
	 * clears before the main effect re-applies, never after it.
	 */
	useIsomorphicLayoutEffect(
		() => () => {
			const track = trackRef.current;
			if (track) release(track, storeRef.current);
		},
		[trackRef, storeRef],
	);
}
