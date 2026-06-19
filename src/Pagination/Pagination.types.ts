import type { CSSProperties } from "react";

// Pagination dots.
// dotStyle/dotClassName apply to every dot; activeDotStyle/activeDotClassName merge on top for the active dot.
export type PaginationConfig = {
  style?: CSSProperties;
  className?: string;
  dotStyle?: CSSProperties;
  dotClassName?: string;
  activeDotStyle?: CSSProperties;
  activeDotClassName?: string;
};
