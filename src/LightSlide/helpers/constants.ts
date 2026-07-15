/** Default seconds of ≥50% viewport visibility before onViewedSlides fires. */
export const DEFAULT_VIEWED_TIMEOUT = 30;

/**
 * Default per-slide accessible name — the WAI-ARIA APG position label. Module-level so its identity
 * is stable (the display-children memo depends on it).
 */
export const DEFAULT_SLIDE_LABEL = (index: number, count: number) =>
	`${index + 1} of ${count}`;

/** Snap animation tuning (used by the track transform). */
export const SNAP_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
export const SNAP_DURATION_MS = 300;

/** Movement (px) before a gesture is locked to horizontal vs vertical intent. */
export const DRAG_DIRECTION_LOCK_PX = 4;

/** Resistance divisor applied when dragging past the first/last slide (rubber-band). */
export const RUBBER_BAND_DIVISOR = 3;

/** Fraction of the carousel that must be visible to count as "in viewport". */
export const VIEWPORT_THRESHOLD = 0.5;

/** Default flow (continuous ticker) speed, px per second. */
export const DEFAULT_FLOW_SPEED = 40;

/** Default flow pause after an interaction, ms. */
export const DEFAULT_FLOW_RESUME_DELAY = 2000;
