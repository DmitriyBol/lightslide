import { isValidElement } from "react";

import type { ReactNode } from "react";

import { Slide } from "../../Slide/Slide";
import type { SlideProps } from "../../types";

// Reads the `data` prop off each direct Slide child (undefined for anything else),
// preserving order so indices line up with the rendered slides.
export function collectSlideData(children: ReactNode[]): unknown[] {
  return children.map((child) =>
    isValidElement(child) && child.type === Slide
      ? (child.props as SlideProps).data
      : undefined,
  );
}
