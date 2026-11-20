import {useEffect} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {NavigateFn} from '../../LightSlide/helpers/navigation';
import type {LightSlideStore} from '../../LightSlide/helpers/store';
import {useLatestRef} from '../../LightSlide/helpers/useLatestRef/useLatestRef';

/**
 * How often the pause/index watcher polls the store. The pause flags (hover/focus/drag/api)
 * are written by other hooks without re-rendering, so the cycle clock samples them — this is
 * also the worst-case lag between a pause starting and the countdown ring freezing.
 */
const WATCH_MS = 50;

/**
 * CSS custom properties published on the carousel container for the countdown ring
 * (`<Pagination progress>`): the cycle length and the running/paused state. Custom
 * properties inherit, so the pagination dots consume them through pure CSS without
 * importing anything from this module — tree-shaking stays intact.
 */
const DURATION_VAR = '--ls-autoplay-ms';
const STATE_VAR = '--ls-autoplay-state';

/**
 * `interval` is the ms a slide is held before advancing; `pauseOnHover`/`pauseOnFocus` are
 * the resolved booleans gating the cycle on the store's hovered/focusWithin flags.
 */
type AutoScrollParams = {
	enabled: boolean;
	interval: number;
	pauseOnHover: boolean;
	pauseOnFocus: boolean;
	containerRef: RefObject<HTMLDivElement | null>;
	storeRef: MutableRefObject<LightSlideStore>;
	goToIndex: NavigateFn;
};

/**
 * Advances navigation on a deadline clock: one full `interval` per slide, pausing freezes
 * the remaining time (a hover longer than the interval no longer burns the tick) and any
 * navigation from outside this hook (button/pagination/drag/api) restarts the cycle, so the
 * countdown ring and the actual advance always agree. Navigation goes through source
 * "auto". Reaches goToIndex through a latest-ref so the effect only re-runs on a config
 * change. Publishes `--ls-autoplay-ms`/`--ls-autoplay-state` on the container for the
 * pagination countdown ring while enabled and removes them on cleanup.
 */
export function useAutoScroll({
	enabled,
	interval,
	pauseOnHover,
	pauseOnFocus,
	containerRef,
	storeRef,
	goToIndex,
}: AutoScrollParams): void {
	const goToIndexRef = useLatestRef(goToIndex);

	useEffect(() => {
		if (!enabled) return;

		const element = containerRef.current;
		element?.style.setProperty(DURATION_VAR, `${interval}ms`);

		const isPaused = () => {
			const {autoScrollPaused, apiPaused, hovered, focusWithin} =
				storeRef.current;
			return (
				autoScrollPaused ||
				apiPaused ||
				(pauseOnHover && hovered) ||
				(pauseOnFocus && focusWithin)
			);
		};

		const publish = (paused: boolean) => {
			element?.style.setProperty(STATE_VAR, paused ? 'paused' : 'running');
		};

		let remaining = interval;
		let cycleStart = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let wasPaused = isPaused();
		/** The index this hook last navigated to (or last saw) — externals show up as a diff. */
		let lastIndex = storeRef.current.currentIndex;

		const tick = () => {
			timer = undefined;
			if (isPaused()) return;
			const {currentIndex, maxIndex, isLoop} = storeRef.current;
			const next = !isLoop && currentIndex >= maxIndex ? 0 : currentIndex + 1;
			lastIndex = next;
			goToIndexRef.current(next, 'auto');
			remaining = interval;
			schedule();
		};

		const schedule = () => {
			if (timer !== undefined) clearTimeout(timer);
			cycleStart = performance.now();
			timer = setTimeout(tick, remaining);
			publish(false);
		};

		const freeze = () => {
			if (timer !== undefined) {
				remaining = Math.max(0, remaining - (performance.now() - cycleStart));
				clearTimeout(timer);
				timer = undefined;
			}
			publish(true);
		};

		if (wasPaused) {
			publish(true);
		} else {
			schedule();
		}

		/**
		 * The store's pause flags and currentIndex change without re-rendering this component,
		 * so a light watcher samples them: pause transitions freeze/resume the clock in place,
		 * and an index change this hook did not cause restarts the cycle from the top.
		 */
		const watcher = setInterval(() => {
			const paused = isPaused();
			if (paused !== wasPaused) {
				wasPaused = paused;
				if (paused) {
					freeze();
				} else {
					schedule();
				}
			}
			const {currentIndex} = storeRef.current;
			if (currentIndex !== lastIndex) {
				lastIndex = currentIndex;
				remaining = interval;
				if (isPaused()) {
					freeze();
				} else {
					schedule();
				}
			}
		}, WATCH_MS);

		return () => {
			if (timer !== undefined) clearTimeout(timer);
			clearInterval(watcher);
			element?.style.removeProperty(DURATION_VAR);
			element?.style.removeProperty(STATE_VAR);
		};
	}, [
		enabled,
		interval,
		pauseOnHover,
		pauseOnFocus,
		containerRef,
		storeRef,
		goToIndexRef,
	]);
}
