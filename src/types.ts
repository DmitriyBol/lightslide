import type {CSSProperties, ReactNode} from 'react';

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
	analytics?: AnalyticsHandlers<T>;
	slidesPerView?: number;
	autoScroll?: AutoScrollConfig;
	flow?: FlowConfig;
	navigation?: NavigationConfig;
	pagination?: PaginationConfig;
	isLoop?: boolean;
	// When true, the carousel renders `fallback` instead of the slides — useful while
	// async slide data is still being fetched. With no `fallback` it renders nothing.
	loading?: boolean;
	// Node rendered in place of the track while `loading` is true (your own skeleton /
	// spinner / placeholder). Style it however you like.
	fallback?: ReactNode;
};

// Individual slide props. Generic over the `data` shape so `<Slide<Product> data={…} />`
// is fully typed; defaults to unknown, so untyped usage keeps working.
// `children` is `ReactNode` — the precise React type for renderable content: a single
// element, several elements, an array, text, or a fragment are all valid slide contents.
export type SlideProps<T = unknown> = {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	data?: T;
};

// Analytics event handlers + config. All fields are optional; unhandled events are
// completely silent. Generic over the slide `data` shape `T`, which flows into the
// terminal-event payloads (onReachedEnd / onViewedSlides). The viewed-slides config lives
// here too, so everything analytics related sits in one place.
export type AnalyticsHandlers<T = unknown> = {
	onInViewport?: (payload: InViewportPayload) => void;
	onSlide?: (payload: SlidePayload) => void;
	onReachedEnd?: (payload: ReachedEndPayload<T>) => void;
	onViewedSlides?: (payload: ViewedSlidesPayload<T>) => void;
	onNavButtonClick?: (payload: NavigationButtonPayload) => void;
	onPaginationClick?: (payload: PaginationClickPayload) => void;
	// Seconds of ≥50% viewport visibility before onViewedSlides fires. Only has any
	// effect when an onViewedSlides handler is provided (the timer is otherwise never
	// started). Default 30.
	viewedTimeout?: number;
};

// Fired once the first time the carousel enters ≥50% of the viewport.
export type InViewportPayload = {
	event: 'carousel_in_viewport';
};

// Fired on every navigation — drag, button, pagination, or auto-scroll.
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

// Fired when a prev/next button is clicked, in addition to onSlide.
export type NavigationButtonPayload = {
	event: 'carousel_nav_button';
	direction: 'left' | 'right';
	fromIndex: number;
	toIndex: number;
};

// Fired when a pagination dot is clicked, in addition to onSlide.
export type PaginationClickPayload = {
	event: 'carousel_pagination_click';
	fromIndex: number;
	toIndex: number;
};
