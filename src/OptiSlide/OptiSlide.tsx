import React from "react";

import { useSwiperContext } from "../swiperContext";
import type { OptiSlideProps } from "../types";
import { cx } from "../utils/cx";
import styles from "./OptiSlide.module.scss";

export const OptiSlide = React.memo(
  React.forwardRef<HTMLDivElement, OptiSlideProps>(function OptiSlide(
    { children, style, className },
    ref,
  ) {
    const { slideWidth } = useSwiperContext();

    return (
      <div
        ref={ref}
        className={cx(styles.slide, className)}
        style={{
          width: slideWidth > 0 ? `${slideWidth}px` : "100%",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }),
);

OptiSlide.displayName = "OptiSlide";
