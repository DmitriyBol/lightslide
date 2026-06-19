import { OptiSlide } from "../../OptiSlide/OptiSlide";
import { collectSlideData } from "./slideData";

describe("collectSlideData", () => {
  it("extracts the data prop from OptiSlide children, preserving order", () => {
    const children = [
      <OptiSlide key="a" data={{ id: 1 }}>
        A
      </OptiSlide>,
      <OptiSlide key="b" data={{ id: 2 }}>
        B
      </OptiSlide>,
    ];
    expect(collectSlideData(children)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("yields undefined for non-OptiSlide children and missing data", () => {
    const children = [
      <div key="x">x</div>,
      <OptiSlide key="b" data={5}>
        B
      </OptiSlide>,
      <OptiSlide key="c">C</OptiSlide>,
      "plain text",
    ];
    expect(collectSlideData(children)).toEqual([
      undefined,
      5,
      undefined,
      undefined,
    ]);
  });

  it("returns an empty array for no children", () => {
    expect(collectSlideData([])).toEqual([]);
  });
});
