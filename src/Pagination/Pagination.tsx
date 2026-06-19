import { useCallback } from "react";

import { useLightSlideContext } from "../lightSlideContext";
import { cx } from "../utils/cx";
import styles from "./Pagination.module.scss";
import type { PaginationConfig } from "./Pagination.types";

type PaginationProps = {
  config: PaginationConfig;
};

export function Pagination({ config }: PaginationProps) {
  const { currentIndex, maxIndex, goToIndex } = useLightSlideContext();

  // Number of dots = number of scrollable positions
  const dotCount = maxIndex + 1;

  const handleDotClick = useCallback(
    (index: number) => {
      goToIndex(index, "pagination");
    },
    [goToIndex],
  );

  return (
    <div
      className={cx(styles.container, config.className)}
      style={config.style}
    >
      {Array.from({ length: dotCount }, (_, i) => {
        const isActive = i === currentIndex;
        return (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={isActive ? "true" : undefined}
            className={cx(
              styles.dot,
              isActive && styles.active,
              config.dotClassName,
              isActive ? config.activeDotClassName : undefined,
            )}
            style={{
              ...config.dotStyle,
              ...(isActive ? config.activeDotStyle : undefined),
            }}
            onClick={() => handleDotClick(i)}
          />
        );
      })}
    </div>
  );
}
