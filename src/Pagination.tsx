import React, { useCallback } from "react";

import { useSwiperContext } from "./swiperContext";
import type { PaginationConfig } from "./types";

type PaginationProps = {
  config: PaginationConfig;
};

const DEFAULT_CONTAINER_STYLE: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
  padding: "10px 0 2px",
};

const DEFAULT_DOT_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  border: "none",
  padding: 0,
  cursor: "pointer",
  background: "rgba(0, 0, 0, 0.25)",
  flexShrink: 0,
  transition: "transform 200ms ease, background 200ms ease",
};

const DEFAULT_ACTIVE_DOT_STYLE: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.75)",
  transform: "scale(1.3)",
};

export function Pagination({ config }: PaginationProps) {
  const { currentIndex, maxIndex, goToIndex } = useSwiperContext();

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
      className={config.className}
      style={{ ...DEFAULT_CONTAINER_STYLE, ...config.style }}
    >
      {Array.from({ length: dotCount }, (_, i) => {
        const isActive = i === currentIndex;
        return (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={isActive ? "true" : undefined}
            className={
              [
                config.dotClassName,
                isActive ? config.activeDotClassName : undefined,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            style={{
              ...DEFAULT_DOT_STYLE,
              ...config.dotStyle,
              ...(isActive
                ? { ...DEFAULT_ACTIVE_DOT_STYLE, ...config.activeDotStyle }
                : {}),
            }}
            onClick={() => handleDotClick(i)}
          />
        );
      })}
    </div>
  );
}
