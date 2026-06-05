import React from "react";

import { useSwiperContext } from "./swiperContext";
import type { OptiSlideProps } from "./types";

export const OptiSlide = React.memo(
  React.forwardRef<HTMLDivElement, OptiSlideProps>(function OptiSlide(
    { children, style, className },
    ref,
  ) {
    const { slideWidth } = useSwiperContext();

    return (
      <div
        ref={ref}
        className={className}
        style={{
          flexShrink: 0,
          width: slideWidth > 0 ? `${slideWidth}px` : "100%",
          boxSizing: "border-box",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }),
);

OptiSlide.displayName = "OptiSlide";
