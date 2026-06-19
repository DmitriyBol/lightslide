import { createContext, useContext } from "react";

// Context consumed by Navigation and Pagination.
export type LightSlideContextType = {
  slideWidth: number;
  currentIndex: number;
  maxIndex: number;
  isLoop: boolean;
  goToIndex: (index: number, source: "button" | "pagination") => void;
};

export const LightSlideContext = createContext<LightSlideContextType>({
  slideWidth: 0,
  currentIndex: 0,
  maxIndex: 0,
  isLoop: false,
  goToIndex: () => {},
});

export const useLightSlideContext = () => useContext(LightSlideContext);
