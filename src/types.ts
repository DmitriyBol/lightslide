import type {AriaAttributes, AriaRole, CSSProperties, ReactNode} from 'react';

import type {NavigationConfig} from './Navigation/Navigation.types';
import type {PaginationConfig} from './Pagination/Pagination.types';

// Component-specific config types live with their feature.
// Re-exported here so the public types form one cohesive surface.
export type {NavigationConfig} from './Navigation/Navigation.types';
export type {NavButtonRenderProps} from './Navigation/Navigation.types';
export type {PaginationConfig} from './Pagination/Pagination.types';

// Slide index + the data attached to a slide, included in analytics payloads. Generic over
// the data shape: specify it (e.g. `SlideData<Product>`) for a fully-typed `data`, or let it
// default to `unknown` — the safe, must-narrow-before-use default for "consumer didn't say".
export type SlideData<T = unknown> = {
	index: number;
	data?: T;
};

// Automatic slide cycling. Set enabled: false to pause without removing the prop.
export type AutoScrollConfig = {
	enabled: boolean;
	interval: number;
};

// Continuous "flow"/ticker scrolling. Supersedes autoScroll when enabled and
// works seamlessly with looping (clones are added automatically). Interacting with
// the carousel pauses it; it resumes resumeDelay ms after the interaction ends.
export type FlowConfig = {
	enabled: boolean;
	speed?: number; // px per second; default 40
	resumeDelay?: number; // ms paused after an interaction; default 2000
};

// Main carousel props. Generic over the slide `data` shape `T` (carried through to the
// analytics payloads), defaulting to `unknown`. Write `<LightSlide<Product> …>` to type the
// whole chain; omit it and everything still works with an unspecified data type.
export type LightSlideProps<T = unknown> = {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	trackStyle?: CSSProperties;
	trackClassName?: string;
	// Accessible name for the carousel region. When set, the container is a labelled `region`
	// landmark (else a plain `group`); either way it is announced as a carousel.
	label?: string;
	// Formats each slide's automatic accessible name (default `${index + 1} of ${count}`). A
	// per-slide `aria-label` on `<Slide>` overrides this for that slide.
	slideLabel?: (index: number, count: number) => string;
	analytics?: AnalyticsConfig<T>;
	slidesPerView?: number;
	// Starting position (0..maxIndex, clamped). Uncontrolled: the carousel owns the index
	// afterwards — read changes via onIndexChange or drive them via `index`/the ref handle.
	initialIndex?: number;
	/**
	 * Controlled position: whenever the value changes, the carousel animates to it. It does not
	 * lock the carousel — gestures and buttons still navigate; pair with `onIndexChange` to keep
	 * your state in sync. Ignored while `flow` runs (continuous motion has no discrete position).
	 */
	index?: number;
	// Fires after every settled position change, from any source — drag, buttons, pagination,
	// auto-scroll, or the external API. Simpler than subscribing to analytics for the same fact.
	onIndexChange?: (index: number) => void;
	autoScroll?: AutoScrollConfig;
	flow?: FlowConfig;
	navigation?: NavigationConfig;
	pagination?: PaginationConfig;
	// Opt-in accessibility layer — pass the node(s) from `lightslide/a11y` (e.g. `<A11y />`). Omit
	// it and none of that code enters your bundle (it lives in a separate entry).
	a11y?: ReactNode;
	isLoop?: boolean;
	// When true, the carousel renders `fallback` instead of the slides — useful while
	// async slide data is still being fetched. With no `fallback` it renders nothing.
	loading?: boolean;
	// Node rendered in place of the track while `loading` is true (your own skeleton /
	// spinner / placeholder). Style it however you like.
	fallback?: ReactNode;
};

// Individual slide props. Generic over the `data` shape so `<Slide<Product> data={…} />` is fully
// typed; defaults to unknown, so untyped usage keeps working. `children` is `ReactNode`. Also
// accepts ARIA attributes (`aria-label`, `aria-labelledby`, …), `role`, and `id`, forwarded to the
// slide's DOM node — a per-slide `aria-label`/`aria-labelledby` overrides the automatic "N of M".
export type SlideProps<T = unknown> = AriaAttributes & {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	data?: T;
	role?: AriaRole;
	id?: string;
};

/**
 * Imperative handle exposed through `ref` on `<LightSlide>`. All indices are scroll positions
 * (0..maxIndex — the same positions pagination dots represent; with an integer slidesPerView
 * that is one per slide). `goTo` clamps out-of-range targets; `next`/`prev` step one position
 * and wrap around when `isLoop` is on. While `flow` runs the track has no discrete position,
 * so the navigation methods no-op and `getIndex` reports the last settled index.
 */
export type LightSlideHandle = {
	goTo: (index: number) => void;
	next: () => void;
	prev: () => void;
	getIndex: () => number;
};

// Every analytics event the carousel emits, as one discriminated union — narrow on `event`
// to handle a specific one. Generic over the slide `data` shape `T`, which flows into the
// terminal-event payloads (carousel_reached_end / carousel_viewed_slides).
export type AnalyticsEvent<T = unknown> =
	| InViewportPayload
	| SlidePayload
	| ReachedEndPayload<T>
	| ViewedSlidesPayload<T>
	| NavigationButtonPayload
	| PaginationClickPayload;

// Analytics config: one universal handler plus its knobs. `onEvent` receives every event as the
// discriminated union above (switch on `payload.event`); events you don't handle are silent.
// Generic over the slide `data` shape `T`, carried through to the terminal-event payloads.
export type AnalyticsConfig<T = unknown> = {
	onEvent?: (payload: AnalyticsEvent<T>) => void;
	// Opt-in switch for viewed-slides tracking: the timer starts only when this is set, and its
	// value is the seconds of ≥50% visibility before carousel_viewed_slides fires (default 30).
	// Omit it and the carousel_reached_end terminal stays armed instead.
	viewedTimeout?: number;
};

// Fired once the first time the carousel enters ≥50% of the viewport.
export type InViewportPayload = {
	event: 'carousel_in_viewport';
};

// Fired on every navigation — drag, button, pagination, auto-scroll, or the external API
// (the controlled `index` prop / ref handle).
export type SlidePayload = {
	event: 'carousel_slide';
	direction: 'left' | 'right';
	fromIndex: number;
	toIndex: number;
};

// Fired when the user reaches maxIndex. Mutually exclusive with ViewedSlidesPayload.
// Not fired by auto-scroll loops or isLoop wrap-around. `slides` is every slide.
export type ReachedEndPayload<T = unknown> = {
	event: 'carousel_reached_end';
	slides: SlideData<T>[];
};

// Fired after viewedTimeout seconds of visibility. Mutually exclusive with ReachedEndPayload.
// `slides` is the slides the user actually saw.
export type ViewedSlidesPayload<T = unknown> = {
	event: 'carousel_viewed_slides';
	slides: SlideData<T>[];
	viewedSeconds: number;
};

// Fired when a prev/next button is clicked, in addition to carousel_slide.
export type NavigationButtonPayload = {
	event: 'carousel_nav_button';
	direction: 'left' | 'right';
	fromIndex: number;
	toIndex: number;
};

// Fired when a pagination dot is clicked, in addition to carousel_slide.
export type PaginationClickPayload = {
	event: 'carousel_pagination_click';
	fromIndex: number;
	toIndex: number;
};
