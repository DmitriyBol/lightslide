import {DEFAULT_VIEWED_TIMEOUT} from './constants';

/**
 * The carousel's core data model — one mutable object held in a single ref.
 *
 * Split from the "functional" pieces (the analytics handlers and the navigate fn, which stay in
 * their own refs): everything here is plain state read and written imperatively during gestures
 * and animations — dozens of times per second on pointermove — so it must never live in React
 * state or trigger a re-render. Keeping it in one object means hooks take a single `storeRef`
 * instead of a fan-out of individual refs.
 *
 * Generic over the slide `data` shape `T` (defaults to unknown). T only types `slideData`; the
 * motion hooks that don't read it accept `LightSlideStore` (i.e. `<unknown>`).
 *
 * Most fields are self-describing; the non-obvious ones: `currentIndex` is the active logical
 * index, mutated by navigation and mirrored to React state for rendering. `maxIndex` is the last
 * reachable position, max(0, ceil(slideCount - slidesPerView)) — ceil so a fractional
 * slidesPerView still has a final index that scrolls the last slide flush (see trackOffset).
 * `isLoop` is true when looping is
 * active (the isLoop prop or flow, with more than one position); `loopOffset` is how many clones
 * are prepended/appended (0 when not looping). `slideWidth` is the cached per-slide px width,
 * floor((containerWidth − visible gaps) / slidesPerView), written by useSlideMetrics on
 * mount/resize and read by every motion/gesture/snap path so the hot loop never touches layout
 * (offsetWidth). `gap` is the px space between adjacent slides (CSS column-gap on the track);
 * every offset computation steps by the stride `slideWidth + gap`.
 * `autoScrollPaused` is set while a drag is in progress so auto motion (auto-scroll/flow) pauses.
 * `hovered` / `focusWithin` mirror user engagement with the carousel (pointer over, keyboard
 * focus inside), written by useHoverFocus; auto-scroll and flow read them on their own cadence
 * and pause per their pauseOnHover/pauseOnFocus config. `apiPaused` is the consumer's explicit
 * hold, flipped by the ref handle's pause()/resume() — it stops all auto motion unconditionally.
 * `wheelDeltaX` is the wheel plugin's mailbox while flow runs: horizontal wheel deltas
 * accumulate here and the flow ticker consumes them as extra drift each frame (stays 0 when
 * the wheel plugin isn't mounted or flow is off).
 * `restOffset` is the track's resting translateX in px (positive; the transform negates it),
 * written by every snap and by a free-drag coast coming to rest. Free-mode drags start from
 * it (the rest position is not derivable from currentIndex when the track rests between
 * boundaries), and navigation compares it against the boundary offset to re-align an
 * off-boundary track.
 */
export type LightSlideStore<T = unknown> = {
	currentIndex: number;
	slideCount: number;
	maxIndex: number;
	slidesPerView: number;
	gap: number;
	viewedTimeout: number;
	effectiveFlow: boolean;
	isLoop: boolean;
	loopOffset: number;
	slideWidth: number;
	slideData: (T | undefined)[];
	autoScrollPaused: boolean;
	hovered: boolean;
	focusWithin: boolean;
	apiPaused: boolean;
	wheelDeltaX: number;
	restOffset: number;
};

/** Creates a store seeded with safe defaults; `overrides` is a convenience for tests. */
export function createStore<T = unknown>(
	overrides: Partial<LightSlideStore<T>> = {},
): LightSlideStore<T> {
	return {
		currentIndex: 0,
		slideCount: 0,
		maxIndex: 0,
		slidesPerView: 1,
		gap: 0,
		viewedTimeout: DEFAULT_VIEWED_TIMEOUT,
		effectiveFlow: false,
		isLoop: false,
		loopOffset: 0,
		slideWidth: 0,
		slideData: [],
		autoScrollPaused: false,
		hovered: false,
		focusWithin: false,
		apiPaused: false,
		wheelDeltaX: 0,
		restOffset: 0,
		...overrides,
	};
}
