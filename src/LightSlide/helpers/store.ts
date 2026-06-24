import {DEFAULT_VIEWED_TIMEOUT} from './constants';

// The carousel's core data model — one mutable object held in a single ref.
//
// "Core data" (this) is split from the "functional" pieces (the analytics handlers and
// the navigate fn, which stay in their own refs): everything here is plain state that is
// read and written imperatively during gestures and animations — dozens of times per
// second on pointermove — so it must never live in React state or trigger a re-render.
// Keeping it in one object means hooks take a single `storeRef` instead of a fan-out of
// eight-plus individual refs.
// Generic over the slide `data` shape `T` (defaults to unknown). T only types `slideData`;
// the motion hooks that don't read it accept `LightSlideStore` (i.e. `<unknown>`).
export type LightSlideStore<T = unknown> = {
	// Active logical slide index (0..maxIndex). Mutated by navigation, mirrored to React
	// state for rendering.
	currentIndex: number;
	// Number of <Slide> children.
	slideCount: number;
	// Last reachable scroll position: max(0, floor(slideCount - slidesPerView)).
	maxIndex: number;
	// How many slides are visible at once.
	slidesPerView: number;
	// Seconds of ≥50% visibility before onViewedSlides fires (analytics knob).
	viewedTimeout: number;
	// Whether the continuous flow/ticker is currently driving the track.
	effectiveFlow: boolean;
	// Whether looping is active (isLoop or flow, and there is more than one position).
	isLoop: boolean;
	// Clone slides prepended/appended in loop mode (0 when not looping).
	loopOffset: number;
	// Each slide's `data` prop, indexed to match the rendered slides (undefined for a
	// non-Slide child or a Slide with no `data`).
	slideData: (T | undefined)[];
	// Set while a pointer drag is in progress so auto motion (auto-scroll/flow) pauses.
	autoScrollPaused: boolean;
};

// Creates a store seeded with safe defaults; `overrides` is a convenience for tests.
export function createStore<T = unknown>(
	overrides: Partial<LightSlideStore<T>> = {},
): LightSlideStore<T> {
	return {
		currentIndex: 0,
		slideCount: 0,
		maxIndex: 0,
		slidesPerView: 1,
		viewedTimeout: DEFAULT_VIEWED_TIMEOUT,
		effectiveFlow: false,
		isLoop: false,
		loopOffset: 0,
		slideData: [],
		autoScrollPaused: false,
		...overrides,
	};
}
