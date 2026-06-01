import React from "react";

import type { OptiSlideProps } from "./types";

export const OptiSlide = React.memo(
  React.forwardRef<HTMLDivElement, OptiSlideProps>(function OptiSlide(
    { children, style, className },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          flexShrink: 0,
          width: "100%",
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
