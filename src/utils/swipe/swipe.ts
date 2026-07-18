/** Minimum drag velocity (px/ms) that triggers a snap even below the distance threshold. */
export const VELOCITY_THRESHOLD = 0.3;

/** Fraction of slide width the user must drag to trigger a snap. */
export const SNAP_THRESHOLD_RATIO = 0.5;

/**
 * Decides which slide to snap to after a drag gesture. `stride` is the distance between
 * adjacent snap positions — slideWidth + gap.
 * Snaps when |dragDeltaX| > stride × SNAP_THRESHOLD_RATIO, or |velocityX| > VELOCITY_THRESHOLD.
 * The number of slides moved is round(|dragDeltaX| / stride) (at least 1 once a snap is
 * triggered), so dragging across several slides in a single gesture lands on the slide actually
 * under the viewport rather than always advancing by one.
 * When isLoop is true, an out-of-range result (< 0 or > maxIndex) signals a loop wrap to the caller.
 */
export function getSnapIndex(
	currentIndex: number,
	maxIndex: number,
	dragDeltaX: number,
	stride: number,
	velocityX: number,
	isLoop = false,
): number {
	if (stride === 0) return currentIndex;

	const absDelta = Math.abs(dragDeltaX);
	const absVelocity = Math.abs(velocityX);
	const shouldAdvance =
		absDelta > stride * SNAP_THRESHOLD_RATIO ||
		absVelocity > VELOCITY_THRESHOLD;

	if (!shouldAdvance) return currentIndex;

	/** Nearest-slide snap; a fast flick over a short distance still moves at least one. */
	const steps = Math.max(1, Math.round(absDelta / stride));

	if (dragDeltaX < 0) {
		return isLoop
			? currentIndex + steps
			: Math.min(maxIndex, currentIndex + steps);
	}
	return isLoop ? currentIndex - steps : Math.max(0, currentIndex - steps);
}
