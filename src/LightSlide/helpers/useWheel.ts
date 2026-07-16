import {useEffect, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {
	WHEEL_LINE_PX,
	WHEEL_PAGE_PX,
	WHEEL_RESET_MS,
	WHEEL_RISE_FLOOR_PX,
	WHEEL_RISE_RATIO,
} from './constants';
import type {NavigateFn} from './navigation';
import type {LightSlideStore} from './store';

/**
 * `threshold` is the accumulated horizontal px that commits a page turn; `navigate` is the
 * core navigation path handed through the wheel seam.
 */
type WheelParams = {
	enabled: boolean;
	threshold: number;
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	navigate: NavigateFn;
};

/**
 * Wheel/trackpad gestures. Binds a native non-passive `wheel` listener on the container
 * (React's synthetic wheel is registered passive, so it cannot preventDefault) and decides
 * per event on the dominant axis: vertical-dominant events are never touched — page scrolling
 * stays native — while horizontal-dominant ones are consumed (which also suppresses the
 * browser's history swipe). Horizontal deltas accumulate until `threshold`, then commit one
 * page turn per gesture: the inertia tail an unlocking trackpad keeps sending is swallowed
 * until either WHEEL_RESET_MS of silence ends the gesture or a sharply rising delta betrays a
 * new user impulse. While flow runs there is no discrete position to page — deltas route into
 * the store's wheel mailbox instead and the flow ticker drifts by them.
 */
export function useWheel({
	enabled,
	threshold,
	containerRef,
	storeRef,
	navigate,
}: WheelParams): void {
	/** Latest-refs so a re-created navigate or a threshold change never rebinds the listener. */
	const navigateRef = useRef(navigate);
	navigateRef.current = navigate;
	const thresholdRef = useRef(threshold);
	thresholdRef.current = threshold;

	useEffect(() => {
		const container = containerRef.current;
		if (!enabled || !container) return;

		/**
		 * Per-gesture scratch, scoped to the binding: `acc` is the accumulated horizontal px,
		 * `lastAbs`/`lastTime` the previous event's magnitude and timestamp (for the silence and
		 * rise checks), `cooling` swallows the inertia tail after a committed page turn.
		 */
		const s = {acc: 0, lastAbs: 0, lastTime: 0, cooling: false};

		const onWheel = (e: WheelEvent) => {
			/** Firefox keeps shift+wheel on deltaY; Chrome maps it to deltaX already. */
			const dominantX = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
			const dominantY = e.shiftKey ? 0 : e.deltaY;
			if (Math.abs(dominantX) <= Math.abs(dominantY)) return;

			e.preventDefault();

			const unit =
				e.deltaMode === 1 ? WHEEL_LINE_PX : e.deltaMode === 2 ? WHEEL_PAGE_PX : 1;
			const dx = dominantX * unit;
			const store = storeRef.current;

			if (store.effectiveFlow) {
				store.wheelDeltaX += dx;
				return;
			}

			const now = Date.now();
			const abs = Math.abs(dx);
			const isNewGesture = now - s.lastTime > WHEEL_RESET_MS;
			const isNewImpulse =
				s.cooling &&
				abs > Math.max(s.lastAbs * WHEEL_RISE_RATIO, WHEEL_RISE_FLOOR_PX);
			if (isNewGesture || isNewImpulse) {
				s.acc = 0;
				s.cooling = false;
			}
			s.lastTime = now;
			s.lastAbs = abs;
			if (s.cooling) return;

			s.acc += dx;
			if (Math.abs(s.acc) < thresholdRef.current) return;

			const step = s.acc > 0 ? 1 : -1;
			s.acc = 0;
			s.cooling = true;
			navigateRef.current(store.currentIndex + step, 'drag');
		};

		container.addEventListener('wheel', onWheel, {passive: false});
		const store = storeRef.current;
		return () => {
			container.removeEventListener('wheel', onWheel);
			store.wheelDeltaX = 0;
		};
	}, [enabled, containerRef, storeRef]);
}
