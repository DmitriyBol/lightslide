import { useCallback, useRef } from "react";

import type { SlideData } from "../types";

export function useViewedSlides(getSlideData: (index: number) => unknown) {
  const viewed = useRef<Set<number>>(new Set());

  const markViewed = useCallback((index: number) => {
    viewed.current.add(index);
  }, []);

  const getViewedSlides = useCallback(
    (): SlideData[] =>
      Array.from(viewed.current)
        .sort((a, b) => a - b)
        .map((index) => ({ index, data: getSlideData(index) })),
    [getSlideData],
  );

  return { markViewed, getViewedSlides };
}
