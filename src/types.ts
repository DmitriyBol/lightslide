import type {AriaAttributes, AriaRole, CSSProperties, ReactNode} from 'react';

/**
 * Slide index + the data attached to a slide, included in analytics payloads. Generic over
 * the data shape: specify it (e.g. `SlideData<Product>`) for a fully-typed `data`, or let it
 * default to `unknown` — the safe, must-narrow-before-use default for "consumer didn't say".
 */
export type SlideData<T = unknown> = {
	index: number;
	data?: T;
};

/**
 * Automatic slide cycling every `interval` ms. Set enabled: false to pause without removing
 * the prop. `pauseOnHover` / `pauseOnFocus` (default true) hold the cycling while the pointer
 * is over the carousel or keyboard focus is inside it, resuming when it leaves — the WAI-ARIA
 * APG carousel behaviour; set to false to opt out.
 */
export type AutoScrollConfig = {
	enabled: boolean;
	interval: number;
	pauseOnHover?: boolean;
	pauseOnFocus?: boolean;
};

/**
 * Prop overrides applied while a media query matches — the value type of the `breakpoints`
 * record. Deliberately just the geometry props: the carousel re-measures, re-clamps, and
 * re-snaps when they change (the same path a container resize takes), so a breakpoint flip
 * is safe mid-interaction. Everything else (plugin slots, autoScroll, isLoop) stays with the
 * consumer, who can switch those props on their own media-query state.
 */
export type BreakpointOverrides = {
	slidesPerView?: number;
	gap?: number;
};

/**
 * Main carousel props. Generic over the slide `data` shape `T` (carried through to the
 * analytics payloads), defaulting to `unknown`. Write `<LightSlide<Product> …>` to type the
 * whole chain; omit it and everything still works with an unspecified data type.
 *
 * - `label` — accessible name for the carousel region. When set, the container is a labelled
 *   `region` landmark (else a plain `group`); either way it is announced as a carousel.
 * - `slideLabel` — formats each slide's automatic accessible name (default
 *   `${index + 1} of ${count}`); a per-slide `aria-label` on `<Slide>` overrides it.
 * - `gap` — horizontal space between adjacent slides, px (default 0). Applied as CSS
 *   `column-gap` on the track and folded into all geometry: slide width, snap positions,
 *   the fractional flush of the last slide, loop clones, and flow.
 * - `breakpoints` — responsive overrides: each key is a media query, its value replaces
 *   `slidesPerView`/`gap` while the query matches, e.g.
 *   `{'(min-width: 768px)': {slidesPerView: 2}, '(min-width: 1200px)': {slidesPerView: 3}}`.
 *   When several queries match, later entries win per property, so ordering them
 *   mobile-first behaves like CSS. The server (and any client without `matchMedia`) renders
 *   with the base props; matches apply on hydration.
 * - `initialIndex` — starting position (0..maxIndex, clamped). Uncontrolled: the carousel owns
 *   the index afterwards — read changes via `onIndexChange`, drive them via `index`/the ref.
 * - `index` — controlled position: whenever the value changes, the carousel animates to it. It
 *   does not lock the carousel — gestures and buttons still navigate; pair with
 *   `onIndexChange` to keep your state in sync. Ignored while `flow` runs.
 * - `onIndexChange` — fires after every settled position change, from any source: drag,
 *   buttons, pagination, auto-scroll, or the external API.
 * - `navigation` / `pagination` / `flow` / `wheel` / `free` / `a11y` — the opt-in plugin
 *   slots. Each takes the node(s) from its tree-shakeable entry (`lightslide/navigation`,
 *   `lightslide/pagination`, `lightslide/flow`, `lightslide/wheel`, `lightslide/free`,
 *   `lightslide/a11y`), e.g. `navigation={<Navigation />}` or `flow={<Flow speed={60} />}`.
 *   Omit a slot and none of that entry's code or styles enters your bundle. Flow supersedes
 *   autoScroll and forces looping on while it runs. Wheel turns horizontal trackpad/wheel
 *   gestures into page turns (drift during flow) without touching vertical page scrolling.
 *   Free replaces the drag-to-snap gesture with momentum scrolling (`<FreeScroll />` rests
 *   anywhere, `<FreeScroll snap />` lands on a boundary); flow, when running, still owns the
 *   track.
 * - `loading` — when true, the carousel renders `fallback` instead of the slides — useful
 *   while async slide data is still being fetched. With no `fallback` it renders nothing.
 * - `fallback` — node rendered in place of the track while `loading` is true (your own
 *   skeleton / spinner / placeholder).
 */
export type LightSlideProps<T = unknown> = {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	trackStyle?: CSSProperties;
	trackClassName?: string;
	label?: string;
	slideLabel?: (index: number, count: number) => string;
	analytics?: AnalyticsConfig<T>;
	slidesPerView?: number;
	gap?: number;
	breakpoints?: Record<string, BreakpointOverrides>;
	initialIndex?: number;
	index?: number;
	onIndexChange?: (index: number) => void;
	autoScroll?: AutoScrollConfig;
	flow?: ReactNode;
	navigation?: ReactNode;
	pagination?: ReactNode;
	wheel?: ReactNode;
	free?: ReactNode;
	a11y?: ReactNode;
	isLoop?: boolean;
	loading?: boolean;
	fallback?: ReactNode;
};

/**
 * Individual slide props. Generic over the `data` shape so `<Slide<Product> data={…} />` is fully
 * typed; defaults to unknown, so untyped usage keeps working. `children` is `ReactNode`. Also
 * accepts ARIA attributes (`aria-label`, `aria-labelledby`, …), `role`, and `id`, forwarded to the
 * slide's DOM node — a per-slide `aria-label`/`aria-labelledby` overrides the automatic "N of M".
 */
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
 * `pause`/`resume` hold and release all auto motion (`autoScroll` and `flow`) — wire them to a
 * visible button for the WAI-ARIA APG pause control; manual navigation keeps working while
 * paused, and they work during flow too.
 */
export type LightSlideHandle = {
	goTo: (index: number) => void;
	next: () => void;
	prev: () => void;
	getIndex: () => number;
	pause: () => void;
	resume: () => void;
};

/**
 * Every analytics event the carousel emits, as one discriminated union — narrow on `event`
 * to handle a specific one. Generic over the slide `data` shape `T`, which flows into the
 * terminal-event payloads (carousel_reached_end / carousel_viewed_slides).
 */
export type AnalyticsEvent<T = unknown> =
	| InViewportPayload
	| SlidePayload
	| ReachedEndPayload<T>
	| ViewedSlidesPayload<T>
	| NavigationButtonPayload
	| PaginationClickPayload;

/**
 * Analytics config: one universal handler plus its knobs. `onEvent` receives every event as the
 * discriminated union above (switch on `payload.event`); events you don't handle are silent.
 * Generic over the slide `data` shape `T`, carried through to the terminal-event payloads.
 * `viewedTimeout` is the opt-in switch for viewed-slides tracking: the timer starts only when
 * it is set, and its value is the seconds of ≥50% visibility before carousel_viewed_slides
 * fires (default 30). Omit it and the carousel_reached_end terminal stays armed instead.
 */
export type AnalyticsConfig<T = unknown> = {
	onEvent?: (payload: AnalyticsEvent<T>) => void;
	viewedTimeout?: number;
};

/** Fired once the first time the carousel enters ≥50% of the viewport. */
export type InViewportPayload = {
	event: 'carousel_in_viewport';
};

/**
 * Fired on every navigation — drag, button, pagination, auto-scroll, or the external API
 * (the controlled `index` prop / ref handle).
 */
export type SlidePayload = {
	event: 'carousel_slide';
	direction: 'left' | 'right';
	fromIndex: number;
	toIndex: number;
};

/**
 * Fired when the user reaches maxIndex. Mutually exclusive with ViewedSlidesPayload.
 * Not fired by auto-scroll loops or isLoop wrap-around. `slides` is every slide.
 */
export type ReachedEndPayload<T = unknown> = {
	event: 'carousel_reached_end';
	slides: SlideData<T>[];
};

/**
 * Fired after viewedTimeout seconds of visibility. Mutually exclusive with ReachedEndPayload.
 * `slides` is the slides the user actually saw.
 */
export type ViewedSlidesPayload<T = unknown> = {
	event: 'carousel_viewed_slides';
	slides: SlideData<T>[];
	viewedSeconds: number;
};

/** Fired when a prev/next button is clicked, in addition to carousel_slide. */
export type NavigationButtonPayload = {
	event: 'carousel_nav_button';
	direction: 'left' | 'right';
	fromIndex: number;
	toIndex: number;
};

/** Fired when a pagination dot is clicked, in addition to carousel_slide. */
export type PaginationClickPayload = {
	event: 'carousel_pagination_click';
	fromIndex: number;
	toIndex: number;
};
