import React, {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  buildInViewportPayload,
  buildReachedEndPayload,
  buildSlidePayload,
  buildViewedSlidesPayload,
  mergeHandlers,
} from "./analytics/analytics";
import { useViewedSlides } from "./hooks/useViewedSlides";
import { OptiSlide } from "./OptiSlide";
import type { OptiSwiperProps, SlideData } from "./types";
import { getSwipeDirection } from "./utils/swipe";

const DEFAULT_VIEWED_TIMEOUT = 30;

export function OptiSwiper({
  children,
  style,
  className,
  trackStyle,
  trackClassName,
  analytics,
  viewedTimeout = DEFAULT_VIEWED_TIMEOUT,
}: OptiSwiperProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);

  // "Latest value" refs — written during render, read inside effects/callbacks.
  // This lets all callbacks stay stable (no deps on frequently-changing values)
  // while always seeing the current prop values when they actually run.
  const handlersRef = useRef(mergeHandlers(analytics));
  handlersRef.current = mergeHandlers(analytics);

  const slideCountRef = useRef(Children.count(children));
  slideCountRef.current = Children.count(children);

  const viewedTimeoutRef = useRef(viewedTimeout);
  viewedTimeoutRef.current = viewedTimeout;

  // Collect slide data from OptiSlide children during render (idempotent ref write)
  const slideDataRef = useRef<unknown[]>([]);
  const nextSlideData: unknown[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === OptiSlide) {
      nextSlideData.push((child.props as { data?: unknown }).data);
    } else {
      nextSlideData.push(undefined);
    }
  });
  slideDataRef.current = nextSlideData;

  const getSlideData = useCallback(
    (index: number) => slideDataRef.current[index],
    [],
  );
  const { markViewed, getViewedSlides } = useViewedSlides(getSlideData);

  // Terminal-event mutex: reachedEnd and viewedSlides are mutually exclusive
  const terminalFiredRef = useRef(false);
  const inViewportFiredRef = useRef(false);
  const viewedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewedStartRef = useRef<number | null>(null);

  const fireTerminalIfNeeded = useCallback(
    (kind: "reachedEnd" | "viewedSlides") => {
      if (terminalFiredRef.current) return;
      terminalFiredRef.current = true;

      if (viewedTimerRef.current !== null) {
        clearTimeout(viewedTimerRef.current);
        viewedTimerRef.current = null;
      }

      if (kind === "reachedEnd") {
        const allSlides: SlideData[] = Array.from(
          { length: slideCountRef.current },
          (_, i) => ({ index: i, data: getSlideData(i) }),
        );
        handlersRef.current.onReachedEnd(buildReachedEndPayload(allSlides));
      } else {
        const elapsed = viewedStartRef.current
          ? Math.round((Date.now() - viewedStartRef.current) / 1000)
          : viewedTimeoutRef.current;
        handlersRef.current.onViewedSlides(
          buildViewedSlidesPayload(getViewedSlides(), elapsed),
        );
      }
    },
    [getSlideData, getViewedSlides],
  );

  // Viewport detection — runs once on mount; reads from refs at call time
  useEffect(() => {
    const wrapper = trackRef.current?.parentElement;
    if (!wrapper) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!inViewportFiredRef.current) {
            inViewportFiredRef.current = true;
            handlersRef.current.onInViewport(buildInViewportPayload());
          }

          if (!terminalFiredRef.current && viewedTimerRef.current === null) {
            viewedStartRef.current = Date.now();
            markViewed(currentIndexRef.current);
            viewedTimerRef.current = setTimeout(() => {
              viewedTimerRef.current = null;
              fireTerminalIfNeeded("viewedSlides");
            }, viewedTimeoutRef.current * 1000);
          }
        } else {
          if (viewedTimerRef.current !== null) {
            clearTimeout(viewedTimerRef.current);
            viewedTimerRef.current = null;
          }
        }
      },
      { threshold: 0.5 },
    );

    io.observe(wrapper);
    return () => {
      io.disconnect();
      if (viewedTimerRef.current !== null) clearTimeout(viewedTimerRef.current);
    };
  }, [markViewed, fireTerminalIfNeeded]);

  const scrollToIndex = useCallback(
    (nextIndex: number) => {
      if (!trackRef.current) return;
      const clamped = Math.max(
        0,
        Math.min(slideCountRef.current - 1, nextIndex),
      );
      if (clamped === currentIndexRef.current) return;

      const direction = clamped > currentIndexRef.current ? "right" : "left";
      const from = currentIndexRef.current;
      currentIndexRef.current = clamped;

      trackRef.current.scrollTo({
        left: clamped * trackRef.current.offsetWidth,
        behavior: "smooth",
      });

      markViewed(clamped);
      handlersRef.current.onSlide(buildSlidePayload(direction, from, clamped));

      if (clamped === slideCountRef.current - 1) {
        fireTerminalIfNeeded("reachedEnd");
      }
    },
    [markViewed, fireTerminalIfNeeded],
  );

  const pointerStartX = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerStartX.current === null) return;
      const direction = getSwipeDirection(pointerStartX.current, e.clientX);
      pointerStartX.current = null;
      if (direction === "right") scrollToIndex(currentIndexRef.current + 1);
      else if (direction === "left") scrollToIndex(currentIndexRef.current - 1);
    },
    [scrollToIndex],
  );

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        ...style,
      }}
    >
      <div
        ref={trackRef}
        className={trackClassName}
        style={{
          display: "flex",
          overflowX: "hidden",
          scrollSnapType: "x mandatory",
          willChange: "scroll-position",
          ...trackStyle,
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}
