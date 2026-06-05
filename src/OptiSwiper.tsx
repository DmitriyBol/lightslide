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
  isLoop = false,
}: OptiSwiperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);

  const handlersRef = useRef(mergeHandlers(analytics));
  handlersRef.current = mergeHandlers(analytics);

  const childArray = Children.toArray(children);
  const slideCount = childArray.length;
  const slideCountRef = useRef(slideCount);
  slideCountRef.current = slideCount;

  const maxIndex = Math.max(0, Math.floor(slideCount - slidesPerView));
  const maxIndexRef = useRef(maxIndex);
  maxIndexRef.current = maxIndex;

  const slidesPerViewRef = useRef(slidesPerView);
  slidesPerViewRef.current = slidesPerView;

  const viewedTimeoutRef = useRef(viewedTimeout);
  viewedTimeoutRef.current = viewedTimeout;

  const effectiveLoop = isLoop && maxIndex > 0;
  const loopOffset = effectiveLoop ? Math.ceil(slidesPerView) : 0;
  const isLoopRef = useRef(effectiveLoop);
  isLoopRef.current = effectiveLoop;
  const loopOffsetRef = useRef(loopOffset);
  loopOffsetRef.current = loopOffset;

  const slideDataRef = useRef<unknown[]>([]);
  const nextSlideData: unknown[] = [];
  for (const child of childArray) {
    if (isValidElement(child) && child.type === OptiSlide) {
      nextSlideData.push((child.props as { data?: unknown }).data);
    } else {
      nextSlideData.push(undefined);
    }
  }
  slideDataRef.current = nextSlideData;

  const getSlideData = useCallback(
    (index: number) => slideDataRef.current[index],
    [],
  );
  const { markViewed, getViewedSlides } = useViewedSlides(getSlideData);

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

  const [currentIndex, setCurrentIndex] = useState(0);

  const getComputedSlideWidth = useCallback(
    () =>
      containerRef.current
        ? containerRef.current.offsetWidth / slidesPerViewRef.current
        : 0,
    [],
  );

  // Snaps the track to an absolute visual index (where visual = logical + loopOffset for loop mode).
  // onComplete fires after the transition ends, or immediately when animate is false.
  const snapToVisual = useCallback(
    (visualIndex: number, animate: boolean, onComplete?: () => void) => {
      const track = trackRef.current;
      if (!track) return;
      const sw = getComputedSlideWidth();

      if (animate) {
        track.style.transition = `transform ${SNAP_DURATION_MS}ms ${SNAP_EASING}`;
        track.style.transform = `translateX(${-visualIndex * sw}px)`;
        const onEnd = () => {
          track.style.transition = "";
          track.removeEventListener("transitionend", onEnd);
          onComplete?.();
        };
        track.addEventListener("transitionend", onEnd, { once: true });
      } else {
        track.style.transition = "";
        track.style.transform = `translateX(${-visualIndex * sw}px)`;
        onComplete?.();
      }
    },
    [getComputedSlideWidth],
  );

  const snapTrack = useCallback(
    (logicalIndex: number, animate: boolean) => {
      const visualIndex = isLoopRef.current
        ? logicalIndex + loopOffsetRef.current
        : logicalIndex;
      snapToVisual(visualIndex, animate);
    },
    [snapToVisual],
  );

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
  }, [slidesPerView, isLoop]);

  const navigateToIndex = useCallback(
    (nextIndex: number, source: "drag" | "button" | "pagination" | "auto") => {
      const maxIdx = maxIndexRef.current;
      const loopMode = isLoopRef.current;
      const offset = loopOffsetRef.current;
      const count = slideCountRef.current;

      const isBackwardWrap = loopMode && nextIndex < 0;
      const isForwardWrap = loopMode && nextIndex > maxIdx;

      let clamped: number;
      if (isBackwardWrap) clamped = maxIdx;
      else if (isForwardWrap) clamped = 0;
      else clamped = Math.max(0, Math.min(maxIdx, nextIndex));

      const from = currentIndexRef.current;

      if (clamped === from && !isBackwardWrap && !isForwardWrap) {
        if (source === "drag") snapToVisual(from + (loopMode ? offset : 0), true);
        return;
      }

      const direction: "left" | "right" =
        isForwardWrap || clamped > from ? "right" : "left";

      currentIndexRef.current = clamped;
      setCurrentIndex(clamped);
      markViewed(clamped);

      handlersRef.current.onSlide(buildSlidePayload(direction, from, clamped));

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

      const isLoopWrap = isBackwardWrap || isForwardWrap;
      if (source !== "auto" && !isLoopWrap && clamped === maxIdx) {
        fireTerminalIfNeeded("reachedEnd");
      }

      if (isBackwardWrap) {
        snapToVisual(0, true, () => snapToVisual(maxIdx + offset, false));
      } else if (isForwardWrap) {
        snapToVisual(count + offset, true, () => snapToVisual(offset, false));
      } else {
        snapToVisual(clamped + (loopMode ? offset : 0), true);
      }
    },
    [markViewed, fireTerminalIfNeeded, snapToVisual],
  );

  const goToIndex = useCallback(
    (index: number, source: "button" | "pagination") => {
      navigateToIndex(index, source);
    },
    [navigateToIndex],
  );

  const contextValue = useMemo(
    () => ({ slideWidth, currentIndex, maxIndex, isLoop: effectiveLoop, goToIndex }),
    [slideWidth, currentIndex, maxIndex, effectiveLoop, goToIndex],
  );

  const autoScrollPausedRef = useRef(false);
  const navigateToIndexRef = useRef(navigateToIndex);
  navigateToIndexRef.current = navigateToIndex;

  useEffect(() => {
    if (!autoScroll?.enabled) return;

    const tick = () => {
      if (autoScrollPausedRef.current) return;
      const from = currentIndexRef.current;
      const maxIdx = maxIndexRef.current;
      const next = isLoopRef.current ? from + 1 : from >= maxIdx ? 0 : from + 1;
      navigateToIndexRef.current(next, "auto");
    };

    const timer = setInterval(tick, autoScroll.interval);
    return () => clearInterval(timer);
  }, [autoScroll?.enabled, autoScroll?.interval]);

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

      const atStart =
        !isLoopRef.current && currentIndexRef.current <= 0 && dx > 0;
      const atEnd =
        !isLoopRef.current &&
        currentIndexRef.current >= maxIndexRef.current &&
        dx < 0;
      const delta = atStart || atEnd ? dx / 3 : dx;

      if (trackRef.current) {
        const sw = getComputedSlideWidth();
        const visualIndex = isLoopRef.current
          ? currentIndexRef.current + loopOffsetRef.current
          : currentIndexRef.current;
        trackRef.current.style.transform = `translateX(${-visualIndex * sw + delta}px)`;
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
        isLoopRef.current,
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

  let displayChildren: React.ReactNode[] = childArray;
  if (effectiveLoop && slideCount > 0 && loopOffset > 0) {
    const prependClones = childArray
      .slice(slideCount - loopOffset)
      .map((child, i) =>
        isValidElement(child)
          ? React.cloneElement(child as React.ReactElement, {
              key: `__loop_pre_${i}`,
            })
          : child,
      );
    const appendClones = childArray.slice(0, loopOffset).map((child, i) =>
      isValidElement(child)
        ? React.cloneElement(child as React.ReactElement, {
            key: `__loop_post_${i}`,
          })
        : child,
    );
    displayChildren = [...prependClones, ...childArray, ...appendClones];
  }

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
          {displayChildren}
        </div>

        {navigation && <Navigation config={navigation} />}
        {pagination && <Pagination config={pagination} />}
      </div>
    </SwiperContext.Provider>
  );
}
