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

beforeAll(() => {
  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    value: MockIntersectionObserver,
  });
});

// ──────────────────────────────────────────────────────────────────────────

function makeHandlers(): jest.Mocked<Required<AnalyticsHandlers>> {
  return {
    onInViewport: jest.fn(),
    onSlide: jest.fn(),
    onReachedEnd: jest.fn(),
    onViewedSlides: jest.fn(),
  };
}

function renderSwiper(
  handlers: Partial<AnalyticsHandlers>,
  viewedTimeout = 30,
) {
  return render(
    <OptiSwiper analytics={handlers} viewedTimeout={viewedTimeout}>
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

  it("applies custom styles to the outer wrapper", () => {
    const { container } = render(
      <OptiSwiper style={{ background: "red" }}>
        <OptiSlide>
          <div>A</div>
        </OptiSlide>
      </OptiSwiper>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.background).toBe("red");
  });

  it("applies custom styles to OptiSlide", () => {
    const { container } = render(
      <OptiSwiper>
        <OptiSlide style={{ padding: "20px" }}>
          <div>A</div>
        </OptiSlide>
      </OptiSwiper>,
    );
    const track = container.firstChild?.firstChild as HTMLElement;
    const slide = track?.firstChild as HTMLElement;
    expect(slide.style.padding).toBe("20px");
  });
});
