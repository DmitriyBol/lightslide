import type {
	InViewportPayload,
	NavigationButtonPayload,
	PaginationClickPayload,
	ReachedEndPayload,
	SlideData,
	SlidePayload,
	ViewedSlidesPayload,
} from '../types';

// Pure payload builders. Handlers are called directly and optionally at the fire
// site (`analytics?.onX?.(payload)`) — there is no merging or noop layer: an event
// with no handler simply does nothing.

export function buildInViewportPayload(): InViewportPayload {
	return {event: 'carousel_in_viewport'};
}

export function buildSlidePayload(
	direction: 'left' | 'right',
	fromIndex: number,
	toIndex: number,
): SlidePayload {
	return {
		event: 'carousel_slide',
		direction,
		fromIndex,
		toIndex,
	};
}

export function buildReachedEndPayload<T>(
	slides: SlideData<T>[],
): ReachedEndPayload<T> {
	return {event: 'carousel_reached_end', slides};
}

export function buildViewedSlidesPayload<T>(
	slides: SlideData<T>[],
	viewedSeconds: number,
): ViewedSlidesPayload<T> {
	return {
		event: 'carousel_viewed_slides',
		slides,
		viewedSeconds,
	};
}

export function buildNavButtonPayload(
	direction: 'left' | 'right',
	fromIndex: number,
	toIndex: number,
): NavigationButtonPayload {
	return {
		event: 'carousel_nav_button',
		direction,
		fromIndex,
		toIndex,
	};
}

export function buildPaginationClickPayload(
	fromIndex: number,
	toIndex: number,
): PaginationClickPayload {
	return {
		event: 'carousel_pagination_click',
		fromIndex,
		toIndex,
	};
}
