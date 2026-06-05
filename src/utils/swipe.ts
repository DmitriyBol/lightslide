// Minimum drag velocity (px/ms) that triggers a snap even below the distance threshold.
export const VELOCITY_THRESHOLD = 0.3;

// Fraction of slide width the user must drag to trigger a snap.
export const SNAP_THRESHOLD_RATIO = 0.5;

// Decides which slide to snap to after a drag gesture.
// Snaps forward/backward when |dragDeltaX| > slideWidth × SNAP_THRESHOLD_RATIO, or |velocityX| > VELOCITY_THRESHOLD.
// When isLoop is true, returns -1 or maxIndex+1 at the boundaries to signal a loop wrap to the caller.
export function getSnapIndex(
  currentIndex: number,
  maxIndex: number,
  dragDeltaX: number,
  slideWidth: number,
  velocityX: number,
  isLoop = false,
): number {
  if (slideWidth === 0) return currentIndex;

  const absDelta = Math.abs(dragDeltaX);
  const absVelocity = Math.abs(velocityX);
  const shouldAdvance =
    absDelta > slideWidth * SNAP_THRESHOLD_RATIO ||
    absVelocity > VELOCITY_THRESHOLD;

  if (!shouldAdvance) return currentIndex;

  if (dragDeltaX < 0) {
    return isLoop ? currentIndex + 1 : Math.min(maxIndex, currentIndex + 1);
  }
  return isLoop ? currentIndex - 1 : Math.max(0, currentIndex - 1);
}
