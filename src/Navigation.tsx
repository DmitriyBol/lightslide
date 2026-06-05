import React, { useCallback } from "react";

import { useSwiperContext } from "./swiperContext";
import type { NavigationConfig } from "./types";

type NavigationProps = {
  config: NavigationConfig;
};

const DEFAULT_BUTTON_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0, 0, 0, 0.45)",
  color: "#fff",
  fontSize: 20,
  lineHeight: 1,
  cursor: "pointer",
  userSelect: "none",
  padding: 0,
};

export function Navigation({ config }: NavigationProps) {
  const { currentIndex, maxIndex, isLoop, goToIndex } = useSwiperContext();

  const handlePrev = useCallback(() => {
    goToIndex(currentIndex - 1, "button");
  }, [currentIndex, goToIndex]);

  const handleNext = useCallback(() => {
    goToIndex(currentIndex + 1, "button");
  }, [currentIndex, goToIndex]);

  const baseStyle: React.CSSProperties = {
    ...DEFAULT_BUTTON_STYLE,
    ...config.style,
  };

  const prevDisabled = !isLoop && currentIndex <= 0;
  const nextDisabled = !isLoop && currentIndex >= maxIndex;

  return (
    <>
      <button
        aria-label="Previous slide"
        disabled={prevDisabled}
        className={
          [config.className, config.prevClassName].filter(Boolean).join(" ") ||
          undefined
        }
        style={{
          ...baseStyle,
          left: 8,
          opacity: prevDisabled ? 0.35 : 1,
          ...config.prevStyle,
        }}
        onClick={handlePrev}
      >
        {config.prevLabel ?? "‹"}
      </button>

      <button
        aria-label="Next slide"
        disabled={nextDisabled}
        className={
          [config.className, config.nextClassName].filter(Boolean).join(" ") ||
          undefined
        }
        style={{
          ...baseStyle,
          right: 8,
          opacity: nextDisabled ? 0.35 : 1,
          ...config.nextStyle,
        }}
        onClick={handleNext}
      >
        {config.nextLabel ?? "›"}
      </button>
    </>
  );
}
