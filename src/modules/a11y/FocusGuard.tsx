import {useEffect} from 'react';

import {useA11yContext} from '../../seams/a11ySeam';

/**
 * Keeps the tab order in sync with what's on screen: real slides outside the visible window get
 * `inert`, so keyboard focus can't disappear onto an off-screen slide's links/buttons. Loop clones
 * are already inert (set by the core), so this only manages the real slides — and it touches
 * `inert` on nothing else, so it never fights React over an attribute the core owns.
 *
 * The visible window is [currentIndex, currentIndex + ⌈slidesPerView⌉ − 1] — ceil so a fractional
 * `slidesPerView` keeps its partially-visible peek slide interactive; center mode extends it one
 * slide left, the peek the centring inset exposes. With variable widths the count is measured
 * (`store.visibleCount`) rather than derived: `slidesPerView` is 1 there, and trusting it would
 * make every slide but the active one inert — swallowing clicks on slides in plain view. DOM child positions map back to logical slide
 * indices through the store's loopOffset (center mode prepends extra clones, so it is not
 * derivable from slidesPerView here); clones sit below 0 or at ≥ slideCount and are skipped. On
 * unmount every guard this plugin set is cleared, so slides are interactive again.
 *
 * Guarding the slide the user is standing in would otherwise throw focus to `<body>`: the browser
 * blurs whatever an element inerts. That silently ends keyboard navigation — the Keyboard plugin
 * listens on the carousel container, so once focus leaves it the arrow keys stop arriving, and one
 * press moves one slide and then goes dead. So when the guarded slide holds focus it is handed to
 * the container instead (made programmatically focusable, never tabbable): the arrows keep working,
 * the announcement is the carousel's own region label, and focus stays where the user was working.
 * The tabindex is left behind on unmount on purpose — removing it while the container holds focus
 * would drop focus to `<body>`, which is the bug this avoids.
 *
 * While the flow ticker runs the guard suspends and every real slide stays interactive: the
 * strip drifts without ever changing `currentIndex`, so a window computed from it goes stale
 * immediately — and an inert subtree also swallows pointer events, which would make the
 * drifting slides impossible to grab.
 */
export function FocusGuard() {
	const {
		containerRef,
		trackRef,
		storeRef,
		currentIndex,
		slideCount,
		slidesPerView,
		isLoop,
		isFlow,
	} = useA11yContext();

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;

		const {loopOffset, centerInset, visibleCount} = storeRef.current;
		const firstVisible = centerInset > 0 ? currentIndex - 1 : currentIndex;
		const onScreen = visibleCount > 0 ? visibleCount : Math.ceil(slidesPerView);
		const lastVisible = currentIndex + onScreen - 1;
		const {children} = track;

		const realSlides: {el: HTMLElement; logical: number}[] = [];
		for (let dom = 0; dom < children.length; dom++) {
			const logical = dom - loopOffset;
			if (logical >= 0 && logical < slideCount) {
				realSlides.push({el: children[dom] as HTMLElement, logical});
			}
		}

		let guardedFocus = false;
		for (const {el, logical} of realSlides) {
			const visible =
				isFlow || (logical >= firstVisible && logical <= lastVisible);
			if (visible) {
				el.removeAttribute('inert');
			} else {
				if (el.contains(document.activeElement)) guardedFocus = true;
				el.setAttribute('inert', '');
			}
		}

		const container = containerRef.current;
		if (guardedFocus && container) {
			container.tabIndex = -1;
			container.focus({preventScroll: true});
		}

		return () => {
			for (const {el} of realSlides) el.removeAttribute('inert');
		};
	}, [
		containerRef,
		trackRef,
		storeRef,
		currentIndex,
		slideCount,
		slidesPerView,
		isLoop,
		isFlow,
	]);

	return null;
}
