import type {EmitNav} from './navigation';

/**
 * The carousel's core data model — one mutable object held in a single ref.
 *
 * Split from the "functional" pieces (the navigate fn, which stays in its own ref):
 * everything here is plain state read and written imperatively during gestures and
 * animations — dozens of times per second on pointermove — so it must never live in React
 * state or trigger a re-render. Keeping it in one object means hooks take a single `storeRef`
 * instead of a fan-out of individual refs.
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
 * `centerInset` is the px shift that centres the active slide — (container − slide) / 2,
 * written by useSlideMetrics alongside slideWidth (0 unless align is center with more than
 * one slide per view) and subtracted by trackOffset, so every snap/drag/settle path centres
 * through the same cached value; a positive value doubles as "center mode is on".
 * `autoScrollPaused` is set while a drag is in progress so auto motion (autoplay/flow) pauses.
 * `hovered` / `focusWithin` mirror user engagement with the carousel (pointer over, keyboard
 * focus inside), written by useHoverFocus; autoplay and flow read them on their own cadence
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
 * `emitNav` is the analytics plugin's mailbox: navigateToIndex calls it on every committed
 * position change, and the `lightslide/analytics` plugin assigns/clears it through the seam
 * (null while the plugin isn't mounted — the core never builds an event object itself).
 */
export type LightSlideStore = {
	currentIndex: number;
	slideCount: number;
	maxIndex: number;
	slidesPerView: number;
	gap: number;
	centerInset: number;
	effectiveFlow: boolean;
	isLoop: boolean;
	loopOffset: number;
	slideWidth: number;
	autoScrollPaused: boolean;
	hovered: boolean;
	focusWithin: boolean;
	apiPaused: boolean;
	wheelDeltaX: number;
	restOffset: number;
	emitNav: EmitNav | null;
};

/** Creates a store seeded with safe defaults; `overrides` is a convenience for tests. */
export function createStore(
	overrides: Partial<LightSlideStore> = {},
): LightSlideStore {
	return {
		currentIndex: 0,
		slideCount: 0,
		maxIndex: 0,
		slidesPerView: 1,
		gap: 0,
		centerInset: 0,
		effectiveFlow: false,
		isLoop: false,
		loopOffset: 0,
		slideWidth: 0,
		autoScrollPaused: false,
		hovered: false,
		focusWithin: false,
		apiPaused: false,
		wheelDeltaX: 0,
		restOffset: 0,
		emitNav: null,
		...overrides,
	};
}
