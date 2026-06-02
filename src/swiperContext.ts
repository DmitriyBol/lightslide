import { createContext, useContext } from "react";

export type SwiperContextType = {
  /** Width of one slide in px, computed from container / slidesPerView. */
  slideWidth: number;
};

export const SwiperContext = createContext<SwiperContextType>({
  slideWidth: 0,
});

export const useSwiperContext = () => useContext(SwiperContext);
