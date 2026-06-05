import type { CSSProperties, ReactNode } from "react";

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

// Prev/next navigation buttons.
// style/className apply to both buttons; prevStyle/nextStyle/prevClassName/nextClassName merge on top.
export type NavigationConfig = {
  prevLabel?: ReactNode;
  nextLabel?: ReactNode;
  style?: CSSProperties;
  className?: string;
  prevStyle?: CSSProperties;
  nextStyle?: CSSProperties;
  prevClassName?: string;
  nextClassName?: string;
};

// Pagination dots.
// dotStyle/dotClassName apply to every dot; activeDotStyle/activeDotClassName merge on top for the active dot.
export type PaginationConfig = {
  style?: CSSProperties;
  className?: string;
  dotStyle?: CSSProperties;
  dotClassName?: string;
  activeDotStyle?: CSSProperties;
  activeDotClassName?: string;
};

// Main carousel props.
export type OptiSwiperProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  trackStyle?: CSSProperties;
  trackClassName?: string;
  analytics?: AnalyticsHandlers;
  slidesPerView?: number;
  viewedTimeout?: number;
  autoScroll?: AutoScrollConfig;
  navigation?: NavigationConfig;
  pagination?: PaginationConfig;
  isLoop?: boolean;
};

// Individual slide props.
export type OptiSlideProps = {
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
  event: "carousel_in_viewport";
  timestamp: number;
};

// Fired on every navigation — drag, button, pagination, or auto-scroll.
export type SlidePayload = {
  event: "carousel_slide";
  direction: "left" | "right";
  fromIndex: number;
  toIndex: number;
  timestamp: number;
};

// Fired when the user reaches maxIndex. Mutually exclusive with ViewedSlidesPayload.
// Not fired by auto-scroll loops or isLoop wrap-around.
export type ReachedEndPayload = {
  event: "carousel_reached_end";
  slides: SlideData[];
  timestamp: number;
};

// Fired after viewedTimeout seconds of visibility. Mutually exclusive with ReachedEndPayload.
export type ViewedSlidesPayload = {
  event: "carousel_viewed_slides";
  slides: SlideData[];
  viewedSeconds: number;
  timestamp: number;
};

// Fired when a prev/next button is clicked, in addition to onSlide.
export type NavigationButtonPayload = {
  event: "carousel_nav_button";
  direction: "left" | "right";
  fromIndex: number;
  toIndex: number;
  timestamp: number;
};

// Fired when a pagination dot is clicked, in addition to onSlide.
export type PaginationClickPayload = {
  event: "carousel_pagination_click";
  fromIndex: number;
  toIndex: number;
  timestamp: number;
};
