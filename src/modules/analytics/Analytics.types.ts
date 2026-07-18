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
 * Props of the `<Analytics>` plugin: one universal handler plus its knobs. `onEvent`
 * receives every event as the discriminated union above (switch on `payload.event`); events
 * you don't handle are silent. Generic over the slide `data` shape `T`, carried through to
 * the terminal-event payloads — write `<Analytics<Product> …/>` to type the whole chain.
 * `viewedTimeout` is the opt-in switch for viewed-slides tracking: the timer starts only
 * when it is set, and its value is the seconds of ≥50% visibility before
 * carousel_viewed_slides fires. Omit it and the carousel_reached_end terminal stays armed
 * instead.
 */
export type AnalyticsProps<T = unknown> = {
	onEvent: (payload: AnalyticsEvent<T>) => void;
	viewedTimeout?: number;
};

/** Fired once the first time the carousel enters ≥50% of the viewport. */
export type InViewportPayload = {
	event: 'carousel_in_viewport';
};

/**
 * Fired on every navigation — drag, button, pagination, autoplay, or the external API
 * (the controlled `index` prop / ref handle). `direction` is the visual motion of the
 * track: 'left'/'right' on a horizontal carousel (under rtl a forward step is 'left'),
 * 'up'/'down' on a vertical one (forward is 'down').
 */
export type SlidePayload = {
	event: 'carousel_slide';
	direction: 'left' | 'right' | 'up' | 'down';
	fromIndex: number;
	toIndex: number;
};

/**
 * Fired when the user reaches maxIndex. Mutually exclusive with ViewedSlidesPayload.
 * Not fired by autoplay loops or isLoop wrap-around. `slides` is every slide.
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
	direction: 'left' | 'right' | 'up' | 'down';
	fromIndex: number;
	toIndex: number;
};

/** Fired when a pagination dot is clicked, in addition to carousel_slide. */
export type PaginationClickPayload = {
	event: 'carousel_pagination_click';
	fromIndex: number;
	toIndex: number;
};
