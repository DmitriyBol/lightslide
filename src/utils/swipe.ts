/** Minimum drag velocity (px/ms) that triggers a snap even below the distance threshold. */
export const VELOCITY_THRESHOLD = 0.3;

/** Fraction of slide width the user must drag to trigger a snap. */
export const SNAP_THRESHOLD_RATIO = 0.5;

/**
 * Decide which slide to snap to after a drag gesture.
 *
 * Snaps forward/backward when either:
 *  - |dragDeltaX| > slideWidth * SNAP_THRESHOLD_RATIO  (distance threshold), or
 *  - |velocityX|  > VELOCITY_THRESHOLD                  (quick flick)
 *
 * Returns the clamped target index.
 */
export function getSnapIndex(
  currentIndex: number,
  maxIndex: number,
  dragDeltaX: number,
  slideWidth: number,
  velocityX: number,
): number {
  if (slideWidth === 0) return currentIndex;

  const absDelta = Math.abs(dragDeltaX);
  const absVelocity = Math.abs(velocityX);
  const shouldAdvance =
    absDelta > slideWidth * SNAP_THRESHOLD_RATIO ||
    absVelocity > VELOCITY_THRESHOLD;

  if (!shouldAdvance) return currentIndex;

  if (dragDeltaX < 0) return Math.min(maxIndex, currentIndex + 1); // swiped left  → next
  return Math.max(0, currentIndex - 1); //                           swiped right → prev
}
