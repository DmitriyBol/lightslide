import { act, renderHook } from "@testing-library/react";

import { useViewedSlides } from "./useViewedSlides";

describe("useViewedSlides", () => {
  const slideData = ["Product A", "Product B", "Product C"];
  const getSlideData = (i: number) => slideData[i];

  it("starts with no viewed slides", () => {
    const { result } = renderHook(() => useViewedSlides(getSlideData));
    expect(result.current.getViewedSlides()).toHaveLength(0);
  });

  it("marks slides as viewed and returns them with data", () => {
    const { result } = renderHook(() => useViewedSlides(getSlideData));
    act(() => {
      result.current.markViewed(0);
      result.current.markViewed(2);
    });
    const viewed = result.current.getViewedSlides();
    expect(viewed).toHaveLength(2);
    expect(viewed[0]).toEqual({ index: 0, data: "Product A" });
    expect(viewed[1]).toEqual({ index: 2, data: "Product C" });
  });

  it("deduplicates the same slide index", () => {
    const { result } = renderHook(() => useViewedSlides(getSlideData));
    act(() => {
      result.current.markViewed(1);
      result.current.markViewed(1);
      result.current.markViewed(1);
    });
    expect(result.current.getViewedSlides()).toHaveLength(1);
  });

  it("returns slides sorted by index regardless of insertion order", () => {
    const { result } = renderHook(() => useViewedSlides(getSlideData));
    act(() => {
      result.current.markViewed(2);
      result.current.markViewed(0);
      result.current.markViewed(1);
    });
    const indices = result.current.getViewedSlides().map((s) => s.index);
    expect(indices).toEqual([0, 1, 2]);
  });

  it("accumulates views across multiple separate mark calls", () => {
    const { result } = renderHook(() => useViewedSlides(getSlideData));
    act(() => result.current.markViewed(0));
    act(() => result.current.markViewed(1));
    expect(result.current.getViewedSlides()).toHaveLength(2);
  });
});
