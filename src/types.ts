import type {CSSProperties, ReactNode} from 'react';

import type {NavigationConfig} from './Navigation/Navigation.types';
import type {PaginationConfig} from './Pagination/Pagination.types';

// Component-specific config types live with their feature.
// Re-exported here so the public types form one cohesive surface.
export type {NavigationConfig} from './Navigation/Navigation.types';
export type {NavButtonRenderProps} from './Navigation/Navigation.types';
export type {PaginationConfig} from './Pagination/Pagination.types';

// Slide index + arbitrary data attached to a slide, included in analytics payloads.
export type SlideData = {
	index: number;
	data?: unknown;
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

// Main carousel props.
export type LightSlideProps = {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	trackStyle?: CSSProperties;
	trackClassName?: string;
	analytics?: AnalyticsHandlers;
	slidesPerView?: number;
	// Seconds of ≥50% viewport visibility before onViewedSlides fires. Only has any
	// effect when an onViewedSlides handler is provided (the timer is otherwise never
	// started). Default 30.
	viewedTimeout?: number;
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

// Individual slide props.
export type SlideProps = {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
	data?: unknown;
};

// Analytics event handlers. All fields are optional; unhandled events are completely silent.
export type AnalyticsHandlers = {
	onInViewport?: (payload: InViewportPayload) => void;
	onSlide?: (payload: SlidePayload) => void;
	onReachedEnd?: (payload: ReachedEndPayload) => void;
	onViewedSlides?: (payload: ViewedSlidesPayload) => void;
	onNavButtonClick?: (payload: NavigationButtonPayload) => void;
	onPaginationClick?: (payload: PaginationClickPayload) => void;
};

// Fired once the first time the carousel enters ≥50% of the viewport.
export type InViewportPayload = {
	event: 'carousel_in_viewport';
	timestamp: number;
};

// Fired on every navigation — drag, button, pagination, or auto-scroll.
export type SlidePayload = {
	event: 'carousel_slide';
	direction: 'left' | 'right';
	fromIndex: number;
	toIndex: number;
	timestamp: number;
};

// Fired when the user reaches maxIndex. Mutually exclusive with ViewedSlidesPayload.
// Not fired by auto-scroll loops or isLoop wrap-around.
export type ReachedEndPayload = {
	event: 'carousel_reached_end';
	slides: SlideData[];
	timestamp: number;
};

// Fired after viewedTimeout seconds of visibility. Mutually exclusive with ReachedEndPayload.
export type ViewedSlidesPayload = {
	event: 'carousel_viewed_slides';
	slides: SlideData[];
	viewedSeconds: number;
	timestamp: number;
};

// Fired when a prev/next button is clicked, in addition to onSlide.
export type NavigationButtonPayload = {
	event: 'carousel_nav_button';
	direction: 'left' | 'right';
	fromIndex: number;
	toIndex: number;
	timestamp: number;
};

// Fired when a pagination dot is clicked, in addition to onSlide.
export type PaginationClickPayload = {
	event: 'carousel_pagination_click';
	fromIndex: number;
	toIndex: number;
	timestamp: number;
};
