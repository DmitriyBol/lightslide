// Default seconds of ≥50% viewport visibility before onViewedSlides fires.
export const DEFAULT_VIEWED_TIMEOUT = 30;

// Snap animation tuning (used by the track transform).
export const SNAP_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
export const SNAP_DURATION_MS = 300;

// Movement (px) before a gesture is locked to horizontal vs vertical intent.
export const DRAG_DIRECTION_LOCK_PX = 4;

// Resistance divisor applied when dragging past the first/last slide (rubber-band).
export const RUBBER_BAND_DIVISOR = 3;

// Fraction of the carousel that must be visible to count as "in viewport".
export const VIEWPORT_THRESHOLD = 0.5;
