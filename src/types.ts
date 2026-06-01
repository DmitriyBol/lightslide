import type { CSSProperties, ReactNode } from "react";

export type SlideData = {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

export type OptiSwiperProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  trackStyle?: CSSProperties;
  trackClassName?: string;
  analytics?: AnalyticsHandlers;
  /** Seconds of in-viewport visibility before the viewed-slides event fires (default: 30) */
  viewedTimeout?: number;
};

export type OptiSlideProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

export type AnalyticsHandlers = {
  onInViewport?: (payload: InViewportPayload) => void;
  onSlide?: (payload: SlidePayload) => void;
  onReachedEnd?: (payload: ReachedEndPayload) => void;
  onViewedSlides?: (payload: ViewedSlidesPayload) => void;
};

export type InViewportPayload = {
  event: "carousel_in_viewport";
  timestamp: number;
};

export type SlidePayload = {
  event: "carousel_slide";
  direction: "left" | "right";
  fromIndex: number;
  toIndex: number;
  timestamp: number;
};

export type ReachedEndPayload = {
  event: "carousel_reached_end";
  slides: SlideData[];
  timestamp: number;
};

export type ViewedSlidesPayload = {
  event: "carousel_viewed_slides";
  slides: SlideData[];
  viewedSeconds: number;
  timestamp: number;
};
