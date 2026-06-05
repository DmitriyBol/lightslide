import type {
  AnalyticsHandlers,
  InViewportPayload,
  NavigationButtonPayload,
  PaginationClickPayload,
  ReachedEndPayload,
  SlideData,
  SlidePayload,
  ViewedSlidesPayload,
} from "../types";

type ResolvedHandlers = Required<AnalyticsHandlers>;

const noop = () => {};

export function mergeHandlers(custom?: AnalyticsHandlers): ResolvedHandlers {
  return {
    onInViewport: custom?.onInViewport ?? noop,
    onSlide: custom?.onSlide ?? noop,
    onReachedEnd: custom?.onReachedEnd ?? noop,
    onViewedSlides: custom?.onViewedSlides ?? noop,
    onNavButtonClick: custom?.onNavButtonClick ?? noop,
    onPaginationClick: custom?.onPaginationClick ?? noop,
  };
}

export function buildInViewportPayload(): InViewportPayload {
  return { event: "carousel_in_viewport", timestamp: Date.now() };
}

export function buildSlidePayload(
  direction: "left" | "right",
  fromIndex: number,
  toIndex: number,
): SlidePayload {
  return {
    event: "carousel_slide",
    direction,
    fromIndex,
    toIndex,
    timestamp: Date.now(),
  };
}

export function buildReachedEndPayload(slides: SlideData[]): ReachedEndPayload {
  return { event: "carousel_reached_end", slides, timestamp: Date.now() };
}

export function buildViewedSlidesPayload(
  slides: SlideData[],
  viewedSeconds: number,
): ViewedSlidesPayload {
  return {
    event: "carousel_viewed_slides",
    slides,
    viewedSeconds,
    timestamp: Date.now(),
  };
}

export function buildNavButtonPayload(
  direction: "left" | "right",
  fromIndex: number,
  toIndex: number,
): NavigationButtonPayload {
  return {
    event: "carousel_nav_button",
    direction,
    fromIndex,
    toIndex,
    timestamp: Date.now(),
  };
}

export function buildPaginationClickPayload(
  fromIndex: number,
  toIndex: number,
): PaginationClickPayload {
  return {
    event: "carousel_pagination_click",
    fromIndex,
    toIndex,
    timestamp: Date.now(),
  };
}
