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
  buildReachedEndPayload,
  buildSlidePayload,
  buildViewedSlidesPayload,
  mergeHandlers,
} from "./analytics/analytics";
import { useViewedSlides } from "./hooks/useViewedSlides";
import { OptiSlide } from "./OptiSlide";
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

  // Maximum scrollable index: with slidesPerView=3 and 6 slides → maxIndex=3
  const maxIndex = Math.max(0, slideCount - slidesPerView);
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
    if (w === slideWidthRef.current) return; // no change — skip re-render
    slideWidthRef.current = w;
    setSlideWidth(w);
  }, []);

  // Measure on mount + observe container resizes
  useLayoutEffect(() => {
    measureSlideWidth();
    if (!containerRef.current) return;
    const ro = new ResizeObserver(measureSlideWidth);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureSlideWidth]);

  // Re-measure and re-position when slidesPerView prop changes
  useEffect(() => {
    measureSlideWidth();
    const newMax = Math.max(
      0,
      slideCountRef.current - slidesPerViewRef.current,
    );
    maxIndexRef.current = newMax;
    if (currentIndexRef.current > newMax) currentIndexRef.current = newMax;
    // Jump to corrected position without animation
    snapTrack(currentIndexRef.current, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesPerView]);

  // Context value — only changes when slideWidth changes (avoids unnecessary re-renders)
  const contextValue = useMemo(() => ({ slideWidth }), [slideWidth]);

  // ── Transform-based positioning ───────────────────────────────────────────
  const getComputedSlideWidth = useCallback(
    () =>
      containerRef.current
        ? containerRef.current.offsetWidth / slidesPerViewRef.current
        : 0,
    [],
  );

  /** Move track to `index`, optionally with a CSS ease-out snap animation. */
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
    // Capture pointer so we receive events even when it leaves the element
    e.currentTarget.setPointerCapture(e.pointerId);
    if (trackRef.current) trackRef.current.style.transition = "";
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartX.current === null) return;

      const dx = e.clientX - dragStartX.current;
      const dy = e.clientY - (dragStartY.current ?? e.clientY);

      // Lock drag axis on first significant movement
      if (!isDraggingRef.current) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return; // too small — wait
        if (Math.abs(dy) > Math.abs(dx)) {
          // Primarily vertical — let the browser handle page scroll
          dragStartX.current = null;
          return;
        }
        isDraggingRef.current = true;
      }

      // Rolling velocity estimate
      const now = Date.now();
      const dt = now - lastPointerTime.current;
      if (dt > 0)
        dragVelocityX.current = (e.clientX - lastPointerX.current) / dt;
      lastPointerTime.current = now;
      lastPointerX.current = e.clientX;

      // Rubber-band resistance at edges
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

      const from = currentIndexRef.current;
      if (nextIndex !== from) {
        currentIndexRef.current = nextIndex;
        markViewed(nextIndex);
        handlersRef.current.onSlide(
          buildSlidePayload(
            nextIndex > from ? "right" : "left",
            from,
            nextIndex,
          ),
        );
        if (nextIndex === maxIndexRef.current) {
          fireTerminalIfNeeded("reachedEnd");
        }
      }

      snapTrack(currentIndexRef.current, true);
    },
    [getComputedSlideWidth, snapTrack, markViewed, fireTerminalIfNeeded],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => commitDrag(e.clientX),
    [commitDrag],
  );

  const onPointerCancel = useCallback(() => {
    // Snap back to current index without committing a new one
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
            // pan-y: browser handles vertical scroll, we handle horizontal drag
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
      </div>
    </SwiperContext.Provider>
  );
}
