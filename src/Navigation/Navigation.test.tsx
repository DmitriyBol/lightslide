import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { LightSlideContextType } from "../lightSlideContext";
import { LightSlideContext } from "../lightSlideContext";
import { Navigation } from "./Navigation";

import "@testing-library/jest-dom";

function makeContext(
  overrides?: Partial<LightSlideContextType>,
): LightSlideContextType {
  return {
    slideWidth: 300,
    currentIndex: 1,
    maxIndex: 3,
    isLoop: false,
    goToIndex: jest.fn(),
    ...overrides,
  };
}

function renderNavigation(
  ctx: LightSlideContextType,
  config: React.ComponentProps<typeof Navigation>["config"] = {},
) {
  return render(
    <LightSlideContext.Provider value={ctx}>
      <Navigation config={config} />
    </LightSlideContext.Provider>,
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

  it("does not disable any button when isLoop is true, even at boundary indices", () => {
    renderNavigation(
      makeContext({ currentIndex: 0, maxIndex: 3, isLoop: true }),
    );
    expect(screen.getByLabelText("Previous slide")).not.toBeDisabled();
    expect(screen.getByLabelText("Next slide")).not.toBeDisabled();

    renderNavigation(
      makeContext({ currentIndex: 3, maxIndex: 3, isLoop: true }),
    );
    expect(screen.getAllByLabelText("Previous slide")[1]).not.toBeDisabled();
    expect(screen.getAllByLabelText("Next slide")[1]).not.toBeDisabled();
  });
});

describe("Navigation — render props", () => {
  it("renders custom elements via renderPrev/renderNext and hides the defaults", () => {
    renderNavigation(makeContext(), {
      renderPrev: ({ onClick }) => (
        <button data-testid="custom-prev" onClick={onClick}>
          PREV
        </button>
      ),
      renderNext: ({ onClick }) => (
        <button data-testid="custom-next" onClick={onClick}>
          NEXT
        </button>
      ),
    });
    expect(screen.getByTestId("custom-prev")).toBeInTheDocument();
    expect(screen.getByTestId("custom-next")).toBeInTheDocument();
    expect(screen.queryByLabelText("Previous slide")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next slide")).not.toBeInTheDocument();
  });

  it("wires the passed onClick to goToIndex(currentIndex - 1, 'button') for prev", async () => {
    const goToIndex = jest.fn();
    renderNavigation(makeContext({ currentIndex: 2, goToIndex }), {
      renderPrev: ({ onClick }) => (
        <button data-testid="custom-prev" onClick={onClick}>
          PREV
        </button>
      ),
    });
    await userEvent.click(screen.getByTestId("custom-prev"));
    expect(goToIndex).toHaveBeenCalledWith(1, "button");
  });

  it("wires the passed onClick to goToIndex(currentIndex + 1, 'button') for next", async () => {
    const goToIndex = jest.fn();
    renderNavigation(makeContext({ currentIndex: 1, goToIndex }), {
      renderNext: ({ onClick }) => (
        <button data-testid="custom-next" onClick={onClick}>
          NEXT
        </button>
      ),
    });
    await userEvent.click(screen.getByTestId("custom-next"));
    expect(goToIndex).toHaveBeenCalledWith(2, "button");
  });

  it("passes direction and disabled to the render functions", () => {
    const renderPrev = jest.fn(() => <span />);
    const renderNext = jest.fn(() => <span />);
    renderNavigation(makeContext({ currentIndex: 0, maxIndex: 3 }), {
      renderPrev,
      renderNext,
    });
    expect(renderPrev).toHaveBeenCalledWith(
      expect.objectContaining({ direction: "left", disabled: true }),
    );
    expect(renderNext).toHaveBeenCalledWith(
      expect.objectContaining({ direction: "right", disabled: false }),
    );
  });

  it("reports disabled=false at boundary indices when isLoop is true", () => {
    const renderPrev = jest.fn(() => <span />);
    renderNavigation(
      makeContext({ currentIndex: 0, maxIndex: 3, isLoop: true }),
      {
        renderPrev,
      },
    );
    expect(renderPrev).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: false }),
    );
  });
});
