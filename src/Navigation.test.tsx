import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Navigation } from "./Navigation";
import type { SwiperContextType } from "./swiperContext";
import { SwiperContext } from "./swiperContext";

import "@testing-library/jest-dom";

function makeContext(
  overrides?: Partial<SwiperContextType>,
): SwiperContextType {
  return {
    slideWidth: 300,
    currentIndex: 1,
    maxIndex: 3,
    goToIndex: jest.fn(),
    ...overrides,
  };
}

function renderNavigation(
  ctx: SwiperContextType,
  config: React.ComponentProps<typeof Navigation>["config"] = {},
) {
  return render(
    <SwiperContext.Provider value={ctx}>
      <Navigation config={config} />
    </SwiperContext.Provider>,
  );
}

describe("Navigation", () => {
  it("renders prev and next buttons", () => {
    renderNavigation(makeContext());
    expect(screen.getByLabelText("Previous slide")).toBeInTheDocument();
    expect(screen.getByLabelText("Next slide")).toBeInTheDocument();
  });

  it("shows default labels ‹ and ›", () => {
    renderNavigation(makeContext());
    expect(screen.getByLabelText("Previous slide")).toHaveTextContent("‹");
    expect(screen.getByLabelText("Next slide")).toHaveTextContent("›");
  });

  it("renders custom prev/next labels", () => {
    renderNavigation(makeContext(), {
      prevLabel: "Prev",
      nextLabel: "Next",
    });
    expect(screen.getByLabelText("Previous slide")).toHaveTextContent("Prev");
    expect(screen.getByLabelText("Next slide")).toHaveTextContent("Next");
  });

  it("disables prev button at index 0", () => {
    renderNavigation(makeContext({ currentIndex: 0 }));
    expect(screen.getByLabelText("Previous slide")).toBeDisabled();
    expect(screen.getByLabelText("Next slide")).not.toBeDisabled();
  });

  it("disables next button at maxIndex", () => {
    renderNavigation(makeContext({ currentIndex: 3, maxIndex: 3 }));
    expect(screen.getByLabelText("Next slide")).toBeDisabled();
    expect(screen.getByLabelText("Previous slide")).not.toBeDisabled();
  });

  it("calls goToIndex with (currentIndex - 1, 'button') when prev is clicked", async () => {
    const goToIndex = jest.fn();
    renderNavigation(makeContext({ currentIndex: 2, goToIndex }));
    await userEvent.click(screen.getByLabelText("Previous slide"));
    expect(goToIndex).toHaveBeenCalledWith(1, "button");
  });

  it("calls goToIndex with (currentIndex + 1, 'button') when next is clicked", async () => {
    const goToIndex = jest.fn();
    renderNavigation(makeContext({ currentIndex: 1, goToIndex }));
    await userEvent.click(screen.getByLabelText("Next slide"));
    expect(goToIndex).toHaveBeenCalledWith(2, "button");
  });

});
