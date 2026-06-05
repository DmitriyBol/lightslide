import {
  getSnapIndex,
  SNAP_THRESHOLD_RATIO,
  VELOCITY_THRESHOLD,
} from "./swipe";

describe("getSnapIndex", () => {
  const slideWidth = 300;
  const threshold = slideWidth * SNAP_THRESHOLD_RATIO; // 150px

  it("stays at current index when delta is below distance and velocity thresholds", () => {
    expect(getSnapIndex(1, 4, -(threshold - 1), slideWidth, 0)).toBe(1);
    expect(getSnapIndex(1, 4, threshold - 1, slideWidth, 0)).toBe(1);
  });

  it("advances to next slide when swiped left past threshold", () => {
    expect(getSnapIndex(1, 4, -(threshold + 1), slideWidth, 0)).toBe(2);
  });

  it("goes back to previous slide when swiped right past threshold", () => {
    expect(getSnapIndex(2, 4, threshold + 1, slideWidth, 0)).toBe(1);
  });

  it("clamps at 0 — cannot go before first slide", () => {
    expect(getSnapIndex(0, 4, threshold + 1, slideWidth, 0)).toBe(0);
  });

  it("clamps at maxIndex — cannot go beyond last scroll position", () => {
    expect(getSnapIndex(4, 4, -(threshold + 1), slideWidth, 0)).toBe(4);
  });

  it("snaps forward on high velocity even with small delta", () => {
    const smallDelta = -(threshold - 50); // below distance threshold
    expect(
      getSnapIndex(1, 4, smallDelta, slideWidth, -(VELOCITY_THRESHOLD + 0.1)),
    ).toBe(2);
  });

  it("snaps backward on high velocity even with small delta", () => {
    const smallDelta = threshold - 50; // below distance threshold
    expect(
      getSnapIndex(2, 4, smallDelta, slideWidth, VELOCITY_THRESHOLD + 0.1),
    ).toBe(1);
  });

  it("returns currentIndex when slideWidth is 0 (not yet measured)", () => {
    expect(getSnapIndex(2, 4, -500, 0, 1)).toBe(2);
  });

  describe("isLoop", () => {
    it("returns -1 at index 0 when swiped right past threshold (signals backward wrap)", () => {
      expect(getSnapIndex(0, 4, threshold + 1, slideWidth, 0, true)).toBe(-1);
    });

    it("returns maxIndex+1 at maxIndex when swiped left past threshold (signals forward wrap)", () => {
      expect(getSnapIndex(4, 4, -(threshold + 1), slideWidth, 0, true)).toBe(5);
    });

    it("advances normally when not at a boundary", () => {
      expect(getSnapIndex(2, 4, -(threshold + 1), slideWidth, 0, true)).toBe(3);
    });
  });
});
