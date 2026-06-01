export const SWIPE_THRESHOLD = 40;

/**
 * Returns the navigation direction based on pointer delta.
 * "right" = finger swiped left → advance to next slide
 * "left"  = finger swiped right → go to previous slide
 */
export function getSwipeDirection(
  startX: number,
  endX: number,
  threshold = SWIPE_THRESHOLD,
): "left" | "right" | null {
  const delta = endX - startX;
  if (delta < -threshold) return "right";
  if (delta > threshold) return "left";
  return null;
}
