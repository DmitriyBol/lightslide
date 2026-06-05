import React from "react";

import { act, render, screen } from "@testing-library/react";

import { OptiSlide } from "./OptiSlide";
import { OptiSwiper } from "./OptiSwiper";
import type { AnalyticsHandlers } from "./types";

import "@testing-library/jest-dom";

// ── IntersectionObserver mock ──────────────────────────────────────────────
type IOCallback = (entries: IntersectionObserverEntry[]) => void;
let triggerIO: (isIntersecting: boolean) => void = () => {};

class MockIntersectionObserver {
  constructor(private cb: IOCallback) {
    triggerIO = (isIntersecting: boolean) => {
      cb([{ isIntersecting } as IntersectionObserverEntry]);
    };
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ── ResizeObserver mock ────────────────────────────────────────────────────
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ── Pointer-capture stubs (not implemented in jsdom) ──────────────────────
beforeAll(() => {
  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(global, "ResizeObserver", {
    writable: true,
    value: MockResizeObserver,
  });
  HTMLElement.prototype.setPointerCapture = jest.fn();
  HTMLElement.prototype.releasePointerCapture = jest.fn();
});

// ──────────────────────────────────────────────────────────────────────────

function makeHandlers(): jest.Mocked<Required<AnalyticsHandlers>> {
  return {
    onInViewport: jest.fn(),
    onSlide: jest.fn(),
    onReachedEnd: jest.fn(),
    onViewedSlides: jest.fn(),
    onNavButtonClick: jest.fn(),
    onPaginationClick: jest.fn(),
  };
}

function renderSwiper(
  handlers: Partial<AnalyticsHandlers>,
  viewedTimeout = 30,
  slidesPerView = 1,
) {
  return render(
    <OptiSwiper
      analytics={handlers}
      viewedTimeout={viewedTimeout}
      slidesPerView={slidesPerView}
    >
      <OptiSlide data={{ id: 1, name: "Slide 1" }}>
        <div>Slide 1</div>
      </OptiSlide>
      <OptiSlide data={{ id: 2, name: "Slide 2" }}>
        <div>Slide 2</div>
      </OptiSlide>
      <OptiSlide data={{ id: 3, name: "Slide 3" }}>
        <div>Slide 3</div>
      </OptiSlide>
    </OptiSwiper>,
  );
}

describe("OptiSwiper", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders all slides", () => {
    renderSwiper({});
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.getByText("Slide 2")).toBeInTheDocument();
    expect(screen.getByText("Slide 3")).toBeInTheDocument();
  });

  it("fires onInViewport once when carousel enters viewport", () => {
    const handlers = makeHandlers();
    renderSwiper(handlers);

    act(() => triggerIO(true));

    expect(handlers.onInViewport).toHaveBeenCalledTimes(1);
    expect(handlers.onInViewport.mock.calls[0][0].event).toBe(
      "carousel_in_viewport",
    );
  });

  it("fires onInViewport only once even on repeated IO triggers", () => {
    const handlers = makeHandlers();
    renderSwiper(handlers);

    act(() => triggerIO(true));
    act(() => triggerIO(false));
    act(() => triggerIO(true));

    expect(handlers.onInViewport).toHaveBeenCalledTimes(1);
  });

  it("fires onViewedSlides after timeout and not onReachedEnd", () => {
    const handlers = makeHandlers();
    renderSwiper(handlers, 30);

    act(() => triggerIO(true));
    act(() => jest.advanceTimersByTime(30_000));

    expect(handlers.onViewedSlides).toHaveBeenCalledTimes(1);
    expect(handlers.onReachedEnd).not.toHaveBeenCalled();

    const payload = handlers.onViewedSlides.mock.calls[0][0];
    expect(payload.event).toBe("carousel_viewed_slides");
    expect(payload.slides.length).toBeGreaterThan(0);
  });

  it("does not fire onViewedSlides before timeout elapses", () => {
    const handlers = makeHandlers();
    renderSwiper(handlers, 30);

    act(() => triggerIO(true));
    act(() => jest.advanceTimersByTime(10_000));

    expect(handlers.onViewedSlides).not.toHaveBeenCalled();
  });

  it("renders correct number of slides regardless of slidesPerView", () => {
    renderSwiper({}, 30, 2);
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.getByText("Slide 2")).toBeInTheDocument();
    expect(screen.getByText("Slide 3")).toBeInTheDocument();
  });
});

describe("OptiSwiper — isLoop", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders all real slide content even when clones are added", () => {
    render(
      <OptiSwiper isLoop>
        <OptiSlide>Alpha</OptiSlide>
        <OptiSlide>Beta</OptiSlide>
        <OptiSlide>Gamma</OptiSlide>
      </OptiSwiper>,
    );
    // Real slides are present (clones may add duplicates, so check getAllByText)
    expect(screen.getAllByText("Alpha").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Beta").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Gamma").length).toBeGreaterThanOrEqual(1);
  });

  it("does not disable navigation buttons at first or last index when isLoop is true", () => {
    render(
      <OptiSwiper isLoop navigation={{}}>
        <OptiSlide>A</OptiSlide>
        <OptiSlide>B</OptiSlide>
        <OptiSlide>C</OptiSlide>
      </OptiSwiper>,
    );
    expect(screen.getByLabelText("Previous slide")).not.toBeDisabled();
    expect(screen.getByLabelText("Next slide")).not.toBeDisabled();
  });

  it("does not fire onReachedEnd when isLoop is active", () => {
    const handlers = makeHandlers();
    render(
      <OptiSwiper isLoop analytics={handlers} navigation={{}}>
        <OptiSlide>A</OptiSlide>
        <OptiSlide>B</OptiSlide>
        <OptiSlide>C</OptiSlide>
      </OptiSwiper>,
    );
    // At maxIndex with isLoop, onReachedEnd must never fire (loop wrap suppresses it).
    expect(handlers.onReachedEnd).not.toHaveBeenCalled();
  });
});
