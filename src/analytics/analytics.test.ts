import {
  buildInViewportPayload,
  buildReachedEndPayload,
  buildSlidePayload,
  buildViewedSlidesPayload,
  mergeHandlers,
} from "./analytics";

describe("payload builders", () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(1_000_000));
  afterEach(() => jest.useRealTimers());

  it("buildInViewportPayload returns correct shape", () => {
    expect(buildInViewportPayload()).toEqual({
      event: "carousel_in_viewport",
      timestamp: 1_000_000,
    });
  });

  it("buildSlidePayload returns correct shape", () => {
    expect(buildSlidePayload("right", 0, 1)).toEqual({
      event: "carousel_slide",
      direction: "right",
      fromIndex: 0,
      toIndex: 1,
      timestamp: 1_000_000,
    });
  });

  it("buildReachedEndPayload includes all slides", () => {
    const slides = [
      { index: 0, data: { id: 1 } },
      { index: 1, data: { id: 2 } },
    ];
    const p = buildReachedEndPayload(slides);
    expect(p.event).toBe("carousel_reached_end");
    expect(p.slides).toHaveLength(2);
    expect(p.timestamp).toBe(1_000_000);
  });

  it("buildViewedSlidesPayload includes slides and elapsed time", () => {
    const p = buildViewedSlidesPayload([{ index: 0, data: null }], 30);
    expect(p.event).toBe("carousel_viewed_slides");
    expect(p.viewedSeconds).toBe(30);
    expect(p.slides).toHaveLength(1);
  });
});

describe("mergeHandlers", () => {
  it("falls back to default console handlers when none provided", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const handlers = mergeHandlers();
    handlers.onInViewport(buildInViewportPayload());
    expect(spy).toHaveBeenCalledWith(
      "[OptiSwiper] carousel_in_viewport",
      expect.any(Object),
    );
    spy.mockRestore();
  });

  it("uses custom handler when provided, ignores default", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const customFn = jest.fn();
    const handlers = mergeHandlers({ onSlide: customFn });
    handlers.onSlide(buildSlidePayload("left", 1, 0));
    expect(customFn).toHaveBeenCalledTimes(1);
    expect(customFn.mock.calls[0][0].direction).toBe("left");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("merges partial handlers — provided ones override, rest stay default", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const onSlide = jest.fn();
    const handlers = mergeHandlers({ onSlide });
    handlers.onInViewport(buildInViewportPayload());
    handlers.onSlide(buildSlidePayload("right", 0, 1));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(onSlide).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
