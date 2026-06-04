import React, {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildInViewportPayload,
  buildNavButtonPayload,
  buildPaginationClickPayload,
  buildReachedEndPayload,
  buildSlidePayload,
  buildViewedSlidesPayload,
  mergeHandlers,
} from "./analytics/analytics";
import { useViewedSlides } from "./hooks/useViewedSlides";
import { Navigation } from "./Navigation";
import { OptiSlide } from "./OptiSlide";
import { Pagination } from "./Pagination";
import { SwiperContext } from "./swiperContext";
import type { OptiSwiperProps, SlideData } from "./types";
import { getSnapIndex } from "./utils/swipe";

const DEFAULT_VIEWED_TIMEOUT = 30;
const SNAP_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
const SNAP_DURATION_MS = 300;

export function OptiSwiper({
  children,
  style,
  className,
  trackStyle,
  trackClassName,
  analytics,
  slidesPerView = 1,
  viewedTimeout = DEFAULT_VIEWED_TIMEOUT,
  autoScroll,
  navigation,
  pagination,
}: OptiSwiperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);

  // ── Latest-value refs (written during render, read in callbacks) ──────────
  const handlersRef = useRef(mergeHandlers(analytics));
  handlersRef.current = mergeHandlers(analytics);

  const slideCount = Children.count(children);
  const slideCountRef = useRef(slideCount);
  slideCountRef.current = slideCount;

  const maxIndex = Math.max(0, Math.floor(slideCount - slidesPerView));
  const maxIndexRef = useRef(maxIndex);
  maxIndexRef.current = maxIndex;

  const slidesPerViewRef = useRef(slidesPerView);
  slidesPerViewRef.current = slidesPerView;

  const viewedTimeoutRef = useRef(viewedTimeout);
  viewedTimeoutRef.current = viewedTimeout;

  // ── Slide data (for analytics payloads) ──────────────────────────────────
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

  // ── Terminal-event mutex ──────────────────────────────────────────────────
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

  // ── Slide width — measured from container, passed to slides via context ───
  const [slideWidth, setSlideWidth] = useState(0);
  const slideWidthRef = useRef(0);

  const measureSlideWidth = useCallback(() => {
    if (!containerRef.current) return;
    const w = Math.floor(
      containerRef.current.offsetWidth / slidesPerViewRef.current,
    );
    if (w === slideWidthRef.current) return;
    slideWidthRef.current = w;
    setSlideWidth(w);
  }, []);

  useLayoutEffect(() => {
    measureSlideWidth();
    if (!containerRef.current) return;
    const ro = new ResizeObserver(measureSlideWidth);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureSlideWidth]);

  // ── Reactive currentIndex state — for Navigation and Pagination UI ────────
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Transform-based positioning ───────────────────────────────────────────
  const getComputedSlideWidth = useCallback(
    () =>
      containerRef.current
        ? containerRef.current.offsetWidth / slidesPerViewRef.current
        : 0,
    [],
  );

  const snapTrack = useCallback(
    (index: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      const sw = getComputedSlideWidth();

      if (animate) {
        track.style.transition = `transform ${SNAP_DURATION_MS}ms ${SNAP_EASING}`;
        track.style.transform = `translateX(${-index * sw}px)`;
        const onEnd = () => {
          track.style.transition = "";
          track.removeEventListener("transitionend", onEnd);
        };
        track.addEventListener("transitionend", onEnd, { once: true });
      } else {
        track.style.transition = "";
        track.style.transform = `translateX(${-index * sw}px)`;
      }
    },
    [getComputedSlideWidth],
  );

  // Re-measure and re-position when slidesPerView prop changes
  useEffect(() => {
    measureSlideWidth();
    const newMax = Math.max(
      0,
      Math.floor(slideCountRef.current - slidesPerViewRef.current),
    );
    maxIndexRef.current = newMax;
    const corrected = Math.min(currentIndexRef.current, newMax);
    currentIndexRef.current = corrected;
    setCurrentIndex(corrected);
    snapTrack(corrected, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesPerView]);

  // ── Central navigation function — single source of truth ─────────────────
  const navigateToIndex = useCallback(
    (nextIndex: number, source: "drag" | "button" | "pagination" | "auto") => {
      const clamped = Math.max(0, Math.min(maxIndexRef.current, nextIndex));
      const from = currentIndexRef.current;

      if (clamped === from) {
        if (source === "drag") snapTrack(clamped, true); // snap back
        return;
      }

      const direction = clamped > from ? "right" : "left";
      currentIndexRef.current = clamped;
      setCurrentIndex(clamped);
      markViewed(clamped);

      // onSlide fires for every navigation type
      handlersRef.current.onSlide(buildSlidePayload(direction, from, clamped));

      // Source-specific events
      if (source === "button") {
        handlersRef.current.onNavButtonClick(
          buildNavButtonPayload(direction, from, clamped),
        );
      }
      if (source === "pagination") {
        handlersRef.current.onPaginationClick(
          buildPaginationClickPayload(from, clamped),
        );
      }

      // Auto-scroll loops — don't fire terminal events on wrap-around
      if (source !== "auto" && clamped === maxIndexRef.current) {
        fireTerminalIfNeeded("reachedEnd");
      }

      snapTrack(clamped, true);
    },
    [markViewed, fireTerminalIfNeeded, snapTrack],
  );

  // ── Context value ─────────────────────────────────────────────────────────
  // goToIndex is the narrow public surface exposed to Navigation / Pagination
  const goToIndex = useCallback(
    (index: number, source: "button" | "pagination") => {
      navigateToIndex(index, source);
    },
    [navigateToIndex],
  );

  const contextValue = useMemo(
    () => ({ slideWidth, currentIndex, maxIndex, goToIndex }),
    [slideWidth, currentIndex, maxIndex, goToIndex],
  );

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  // Paused during pointer drag so gestures don't fight auto-scroll
  const autoScrollPausedRef = useRef(false);

  useEffect(() => {
    if (!autoScroll?.enabled) return;

    const tick = () => {
      if (autoScrollPausedRef.current) return;
      const from = currentIndexRef.current;
      const next = from >= maxIndexRef.current ? 0 : from + 1; // loop
      const direction: "left" | "right" = next > from ? "right" : "left";

      currentIndexRef.current = next;
      setCurrentIndex(next);
      markViewed(next);
      handlersRef.current.onSlide(buildSlidePayload(direction, from, next));
      snapTrack(next, true);
    };

    const timer = setInterval(tick, autoScroll.interval);
    return () => clearInterval(timer);
  }, [autoScroll?.enabled, autoScroll?.interval, markViewed, snapTrack]);

  // ── Drag state (refs only — zero React re-renders during gesture) ─────────
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragVelocityX = useRef(0);
  const lastPointerX = useRef(0);
  const lastPointerTime = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    isDraggingRef.current = false;
    dragVelocityX.current = 0;
    lastPointerX.current = e.clientX;
    lastPointerTime.current = Date.now();
    autoScrollPausedRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (trackRef.current) trackRef.current.style.transition = "";
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartX.current === null) return;

      const dx = e.clientX - dragStartX.current;
      const dy = e.clientY - (dragStartY.current ?? e.clientY);

      if (!isDraggingRef.current) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          dragStartX.current = null;
          autoScrollPausedRef.current = false;
          return;
        }
        isDraggingRef.current = true;
      }

      const now = Date.now();
      const dt = now - lastPointerTime.current;
      if (dt > 0)
        dragVelocityX.current = (e.clientX - lastPointerX.current) / dt;
      lastPointerTime.current = now;
      lastPointerX.current = e.clientX;

      const atStart = currentIndexRef.current <= 0 && dx > 0;
      const atEnd = currentIndexRef.current >= maxIndexRef.current && dx < 0;
      const delta = atStart || atEnd ? dx / 3 : dx;

      if (trackRef.current) {
        const sw = getComputedSlideWidth();
        trackRef.current.style.transform = `translateX(${-currentIndexRef.current * sw + delta}px)`;
      }
    },
    [getComputedSlideWidth],
  );

  const commitDrag = useCallback(
    (endX: number) => {
      autoScrollPausedRef.current = false;

      if (dragStartX.current === null || !isDraggingRef.current) {
        dragStartX.current = null;
        isDraggingRef.current = false;
        return;
      }

      const deltaX = endX - dragStartX.current;
      dragStartX.current = null;
      isDraggingRef.current = false;

      const sw = getComputedSlideWidth();
      const nextIndex = getSnapIndex(
        currentIndexRef.current,
        maxIndexRef.current,
        deltaX,
        sw,
        dragVelocityX.current,
      );

      navigateToIndex(nextIndex, "drag");
    },
    [getComputedSlideWidth, navigateToIndex],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => commitDrag(e.clientX),
    [commitDrag],
  );

  const onPointerCancel = useCallback(() => {
    autoScrollPausedRef.current = false;
    dragStartX.current = null;
    isDraggingRef.current = false;
    snapTrack(currentIndexRef.current, true);
  }, [snapTrack]);

  // ── Viewport detection (IntersectionObserver) ─────────────────────────────
  useEffect(() => {
    const wrapper = containerRef.current;
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

  return (
    <SwiperContext.Provider value={contextValue}>
      <div
        ref={containerRef}
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
            willChange: "transform",
            touchAction: "pan-y",
            userSelect: "none",
            cursor: "grab",
            ...trackStyle,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {children}
        </div>

        {navigation && <Navigation config={navigation} />}
        {pagination && <Pagination config={pagination} />}
      </div>
    </SwiperContext.Provider>
  );
}
