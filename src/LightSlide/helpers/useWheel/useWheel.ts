import {useEffect, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {
	WHEEL_LINE_PX,
	WHEEL_PAGE_PX,
	WHEEL_RESET_MS,
	WHEEL_RISE_FLOOR_PX,
	WHEEL_RISE_RATIO,
} from '../constants';
import type {NavigateFn} from '../navigation';
import type {LightSlideStore} from '../store';

/**
 * `threshold` is the accumulated horizontal px that commits a page turn; `goToIndex` is the
 * core navigation path handed through the wheel seam.
 */
type WheelParams = {
	enabled: boolean;
	threshold: number;
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	goToIndex: NavigateFn;
};

/**
 * Wheel/trackpad gestures. Binds a native non-passive `wheel` listener on the container
 * (React's synthetic wheel is registered passive, so it cannot preventDefault) and decides
 * per event on the dominant axis: vertical-dominant events are never touched — page scrolling
 * stays native — while horizontal-dominant ones are consumed (which also suppresses the
 * browser's history swipe). Horizontal deltas accumulate until `threshold`, then commit one
 * page turn per gesture: the inertia tail an unlocking trackpad keeps sending is swallowed
 * until WHEEL_RESET_MS of silence ends the gesture, the delta changes direction, or a sharply
 * rising delta betrays a new user impulse (a decaying tail never flips sign and never grows).
 * While flow runs there is no discrete position to page — deltas route into the store's wheel
 * mailbox instead and the flow ticker drifts by them.
 */
export function useWheel({
	enabled,
	threshold,
	containerRef,
	storeRef,
	goToIndex,
}: WheelParams): void {
	/** Latest-refs so a re-created goToIndex or a threshold change never rebinds the listener. */
	const goToIndexRef = useRef(goToIndex);
	goToIndexRef.current = goToIndex;
	const thresholdRef = useRef(threshold);
	thresholdRef.current = threshold;

	useEffect(() => {
		const container = containerRef.current;
		if (!enabled || !container) return;

		/**
		 * Per-gesture scratch, scoped to the binding: `acc` is the accumulated horizontal px,
		 * `lastDx`/`lastTime` the previous event's signed delta and timestamp (for the silence,
		 * flip, and rise checks), `cooling` swallows the inertia tail after a committed page turn.
		 */
		const s = {acc: 0, lastDx: 0, lastTime: 0, cooling: false};

		const onWheel = (e: WheelEvent) => {
			/** Firefox keeps shift+wheel on deltaY; Chrome maps it to deltaX already. */
			const dominantX = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
			const dominantY = e.shiftKey ? 0 : e.deltaY;
			if (Math.abs(dominantX) <= Math.abs(dominantY)) return;

			e.preventDefault();

			const unit =
				e.deltaMode === 1 ? WHEEL_LINE_PX : e.deltaMode === 2 ? WHEEL_PAGE_PX : 1;
			const store = storeRef.current;
			/** Same logical-space normalization as pointer deltas: under rtl the sign flips once here. */
			const dx = dominantX * unit * store.dirSign;

			if (store.effectiveFlow) {
				store.wheelDeltaX += dx;
				return;
			}

			const now = Date.now();
			/**
			 * A direction change is always a fresh gesture — a decaying inertia tail never flips
			 * sign, and without this a continuous back-and-forth jerk (no silence gap, no rising
			 * delta) would stay swallowed by `cooling` forever and the carousel would freeze.
			 */
			const flipped = s.lastDx !== 0 && (dx > 0) !== (s.lastDx > 0);
			const isNewGesture = now - s.lastTime > WHEEL_RESET_MS || flipped;
			const isNewImpulse =
				s.cooling &&
				Math.abs(dx) >
					Math.max(Math.abs(s.lastDx) * WHEEL_RISE_RATIO, WHEEL_RISE_FLOOR_PX);
			if (isNewGesture || isNewImpulse) {
				s.acc = 0;
				s.cooling = false;
			}
			s.lastTime = now;
			s.lastDx = dx;
			if (s.cooling) return;

			s.acc += dx;
			if (Math.abs(s.acc) < thresholdRef.current) return;

			const step = s.acc > 0 ? 1 : -1;
			s.acc = 0;
			s.cooling = true;
			goToIndexRef.current(store.currentIndex + step, 'drag');
		};

		container.addEventListener('wheel', onWheel, {passive: false});
		const store = storeRef.current;
		return () => {
			container.removeEventListener('wheel', onWheel);
			store.wheelDeltaX = 0;
		};
	}, [enabled, containerRef, storeRef]);
}
