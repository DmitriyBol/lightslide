import {
  buildInViewportPayload,
  buildNavButtonPayload,
  buildPaginationClickPayload,
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

  it("buildNavButtonPayload returns correct shape", () => {
    expect(buildNavButtonPayload("right", 1, 2)).toEqual({
      event: "carousel_nav_button",
      direction: "right",
      fromIndex: 1,
      toIndex: 2,
      timestamp: 1_000_000,
    });
  });

  it("buildPaginationClickPayload returns correct shape", () => {
    expect(buildPaginationClickPayload(0, 3)).toEqual({
      event: "carousel_pagination_click",
      fromIndex: 0,
      toIndex: 3,
      timestamp: 1_000_000,
    });
  });
});

describe("mergeHandlers", () => {
  it("is silent by default — does not log to console when no handler provided", () => {
    const spy = jest.spyOn(console, "log");
    const handlers = mergeHandlers();
    handlers.onInViewport(buildInViewportPayload());
    handlers.onSlide(buildSlidePayload("right", 0, 1));
    handlers.onReachedEnd(buildReachedEndPayload([]));
    handlers.onViewedSlides(buildViewedSlidesPayload([], 30));
    handlers.onNavButtonClick(buildNavButtonPayload("left", 1, 0));
    handlers.onPaginationClick(buildPaginationClickPayload(0, 2));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("calls onSlide handler when provided", () => {
    const onSlide = jest.fn();
    mergeHandlers({ onSlide }).onSlide(buildSlidePayload("left", 1, 0));
    expect(onSlide).toHaveBeenCalledTimes(1);
    expect(onSlide.mock.calls[0][0].direction).toBe("left");
  });

  it("calls onInViewport handler when provided", () => {
    const onInViewport = jest.fn();
    mergeHandlers({ onInViewport }).onInViewport(buildInViewportPayload());
    expect(onInViewport).toHaveBeenCalledTimes(1);
    expect(onInViewport.mock.calls[0][0].event).toBe("carousel_in_viewport");
  });

  it("calls onNavButtonClick handler when provided", () => {
    const onNavButtonClick = jest.fn();
    mergeHandlers({ onNavButtonClick }).onNavButtonClick(
      buildNavButtonPayload("right", 0, 1),
    );
    expect(onNavButtonClick).toHaveBeenCalledTimes(1);
    expect(onNavButtonClick.mock.calls[0][0].event).toBe("carousel_nav_button");
  });

  it("calls onPaginationClick handler when provided", () => {
    const onPaginationClick = jest.fn();
    mergeHandlers({ onPaginationClick }).onPaginationClick(
      buildPaginationClickPayload(0, 3),
    );
    expect(onPaginationClick).toHaveBeenCalledTimes(1);
    expect(onPaginationClick.mock.calls[0][0].event).toBe(
      "carousel_pagination_click",
    );
  });

  it("provided handlers fire, omitted ones stay silent", () => {
    const spy = jest.spyOn(console, "log");
    const onSlide = jest.fn();
    const handlers = mergeHandlers({ onSlide });
    // onSlide provided → fires
    handlers.onSlide(buildSlidePayload("right", 0, 1));
    expect(onSlide).toHaveBeenCalledTimes(1);
    // onInViewport not provided → silent
    handlers.onInViewport(buildInViewportPayload());
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
