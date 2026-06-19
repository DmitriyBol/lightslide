import { isValidElement } from "react";

import type { ReactNode } from "react";

import { OptiSlide } from "../../OptiSlide/OptiSlide";
import type { OptiSlideProps } from "../../types";

// Reads the `data` prop off each direct OptiSlide child (undefined for anything else),
// preserving order so indices line up with the rendered slides.
export function collectSlideData(children: ReactNode[]): unknown[] {
  return children.map((child) =>
    isValidElement(child) && child.type === OptiSlide
      ? (child.props as OptiSlideProps).data
      : undefined,
  );
}
