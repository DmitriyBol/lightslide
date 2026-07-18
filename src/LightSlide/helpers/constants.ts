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

/** Default flow (continuous ticker) speed, px per second. */
export const DEFAULT_FLOW_SPEED = 40;

/** Default flow pause after an interaction, ms. */
export const DEFAULT_FLOW_RESUME_DELAY = 2000;

/** Default accumulated horizontal wheel px before <Wheel> commits a page turn. */
export const DEFAULT_WHEEL_THRESHOLD = 30;

/** Silence (ms) after the last wheel event before the wheel gesture counts as over. */
export const WHEEL_RESET_MS = 150;

/** px per wheel delta unit when the event reports lines / pages instead of pixels. */
export const WHEEL_LINE_PX = 16;
export const WHEEL_PAGE_PX = 100;

/**
 * Inertia-tail escape hatch: a wheel delta this many times the previous one (and above the
 * floor) is a new user impulse, not the decaying tail of the committed gesture.
 */
export const WHEEL_RISE_RATIO = 2;
export const WHEEL_RISE_FLOOR_PX = 4;
