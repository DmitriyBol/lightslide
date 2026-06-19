import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildNavButtonPayload,
  buildPaginationClickPayload,
  buildSlidePayload,
  mergeHandlers,
} from "../analytics/analytics";
import { useViewedSlides } from "../hooks/useViewedSlides";
import { Navigation } from "../Navigation/Navigation";
import { Pagination } from "../Pagination/Pagination";
import { SwiperContext } from "../swiperContext";
import type { OptiSwiperProps } from "../types";
import { cx } from "../utils/cx";
import { DEFAULT_VIEWED_TIMEOUT } from "./helpers/constants";
import { buildLoopChildren } from "./helpers/loopClones";
import type { NavigateSource } from "./helpers/navigation";
import { collectSlideData } from "./helpers/slideData";
import { useAutoScroll } from "./helpers/useAutoScroll";
import { useDragGesture } from "./helpers/useDragGesture";
import { useSlideMetrics } from "./helpers/useSlideMetrics";
import { useTrackSnap } from "./helpers/useTrackSnap";
import { useViewportEngagement } from "./helpers/useViewportEngagement";
import styles from "./OptiSwiper.module.scss";

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
  slideDataRef.current = collectSlideData(childArray);

  const getSlideData = useCallback(
    (index: number) => slideDataRef.current[index],
    [],
  );
  const { markViewed, getViewedSlides } = useViewedSlides(getSlideData);

  const { fireTerminalIfNeeded } = useViewportEngagement({
    containerRef,
    currentIndexRef,
    slideCountRef,
    viewedTimeoutRef,
    handlersRef,
    markViewed,
    getViewedSlides,
    getSlideData,
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const { slideWidth, measureSlideWidth, getComputedSlideWidth } =
    useSlideMetrics(containerRef, slidesPerViewRef);

  const { snapToVisual, snapTrack } = useTrackSnap(
    trackRef,
    getComputedSlideWidth,
    isLoopRef,
    loopOffsetRef,
  );

  // Re-derive maxIndex, clamp the index, and re-snap (no animation) when the layout
  // shape changes — slidesPerView or loop mode.
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

  // Single navigation path. `source` decides which extra analytics events fire and
  // whether a no-op drag snaps back; loop wrap-around is detected from the raw index.
  const navigateToIndex = useCallback(
    (nextIndex: number, source: NavigateSource) => {
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
        if (source === "drag")
          snapToVisual(from + (loopMode ? offset : 0), true);
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
    () => ({
      slideWidth,
      currentIndex,
      maxIndex,
      isLoop: effectiveLoop,
      goToIndex,
    }),
    [slideWidth, currentIndex, maxIndex, effectiveLoop, goToIndex],
  );

  const autoScrollPausedRef = useRef(false);
  const navigateToIndexRef = useRef(navigateToIndex);
  navigateToIndexRef.current = navigateToIndex;

  useAutoScroll(autoScroll, {
    currentIndexRef,
    maxIndexRef,
    isLoopRef,
    autoScrollPausedRef,
    navigateToIndexRef,
  });

  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
    useDragGesture({
      trackRef,
      currentIndexRef,
      maxIndexRef,
      isLoopRef,
      loopOffsetRef,
      autoScrollPausedRef,
      getComputedSlideWidth,
      snapToVisual,
      navigateToIndex,
    });

  const displayChildren = buildLoopChildren(childArray, slideCount, loopOffset);

  return (
    <SwiperContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cx(styles.container, className)}
        style={style}
      >
        <div
          ref={trackRef}
          className={cx(styles.track, trackClassName)}
          style={trackStyle}
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
