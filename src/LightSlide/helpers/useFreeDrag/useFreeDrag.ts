import {useEffect, useRef} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import {prefersReducedMotion} from '../../../utils/reducedMotion/reducedMotion';
import {RUBBER_BAND_DIVISOR} from '../constants';
import type {NavigateFn} from '../navigation';
import type {LightSlideStore} from '../store';
import {maxTrackOffset} from '../trackOffset/trackOffset';
import {trackTransform} from '../trackTransform/trackTransform';
import type {PointerHandlers} from '../usePointerGesture/usePointerGesture';
import {usePointerGesture} from '../usePointerGesture/usePointerGesture';

/**
 * Time constant (ms) of the momentum's exponential decay: velocity falls to 1/e of itself
 * every FREE_DECAY_MS. Doubles as the free-snap projection — the total coast distance of
 * that decay is velocity × FREE_DECAY_MS, so both variants travel the same distance for the
 * same flick and free-snap just quantises the endpoint to a slide boundary. Local to this
 * module (not helpers/constants.ts) deliberately: the constants chunk is shared with every
 * entry, and free-only tuning must not cost bundles that never import `lightslide/free`.
 */
const FREE_DECAY_MS = 325;

/** Momentum (px/ms) below which the coast counts as stopped and settles. */
const FREE_MIN_VELOCITY = 0.02;

/** `snap` is the free-snap variant: coast the same distance, land on a slide boundary. */
type FreeDragParams = {
	snap: boolean;
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	goToIndex: NavigateFn;
};

/**
 * Coast state, held in ONE ref: the rAF loop mutates it every frame, so none of it may live
 * in React state. `pos` is the track offset in px (the transform negates it), `velocity` the
 * px/ms it still carries, `lastTs` the previous frame's timestamp (null on the first frame),
 * `raf` the running frame handle (null when no coast runs).
 */
type CoastState = {
	raf: number | null;
	pos: number;
	velocity: number;
	lastTs: number | null;
};

/**
 * Wraps a loop-mode offset into [base, base + span) — base is the prepended-clones width,
 * span one full content width — the same modulo the flow ticker uses: the clones make the
 * wrapped position pixel-identical, so re-basing mid-gesture or mid-coast never shows a jump.
 */
const wrapPos = (pos: number, store: LightSlideStore): number => {
	const stride = store.slideWidth + store.gap;
	const base = store.loopOffset * stride;
	const span = store.slideCount * stride;
	return span > 0 ? base + ((((pos - base) % span) + span) % span) : pos;
};

/**
 * The track position a drag delta maps to, from the stored rest offset. Loop mode wraps (see
 * wrapPos); non-loop applies rubber-band resistance to the out-of-bounds part of the
 * position, so crossing an edge mid-gesture stiffens exactly at the edge.
 */
const freePos = (dx: number, store: LightSlideStore): number => {
	const raw = store.restOffset - dx;
	if (store.isLoop) return wrapPos(raw, store);
	const max = maxTrackOffset(store);
	if (raw < 0) return raw / RUBBER_BAND_DIVISOR;
	if (raw > max) return max + (raw - max) / RUBBER_BAND_DIVISOR;
	return raw;
};

/**
 * Momentum ("free") drag: the release keeps its flick velocity and the track coasts — a rAF
 * loop integrates it under exponential decay, clamped at the edges when not looping and
 * wrapped seamlessly through the clones when looping. Once the coast stops, the nearest index
 * commits through the 'settle' source: state, pagination, and analytics update, but the track
 * rests exactly where the momentum ended. With `snap` (the free-snap variant) there is no rAF
 * at all — the coast is projected to its endpoint (velocity × FREE_DECAY_MS, the decay's
 * integral) and the track animates straight to the nearest slide boundary through the normal
 * drag navigation. The shared pointer mechanics live in usePointerGesture; drags start from
 * the store's restOffset, since a free rest position is not derivable from currentIndex.
 *
 * Everything here is a plain per-render closure — no useCallback: usePointerGesture latest-refs
 * the four callbacks, so their identity is irrelevant and the wrappers would be dead weight.
 */
export function useFreeDrag({
	snap,
	trackRef,
	storeRef,
	goToIndex,
}: FreeDragParams): PointerHandlers {
	const coast = useRef<CoastState>({
		raf: null,
		pos: 0,
		velocity: 0,
		lastTs: null,
	});

	/** A coast can outlive the component — kill the frame loop on unmount. */
	useEffect(() => {
		const c = coast.current;
		return () => {
			if (c.raf !== null) cancelAnimationFrame(c.raf);
		};
	}, []);

	const applyPos = (pos: number) => {
		if (trackRef.current)
			trackRef.current.style.transform = trackTransform(
				pos,
				storeRef.current.dirSign,
			);
	};

	const stopCoast = () => {
		const c = coast.current;
		if (c.raf !== null) {
			cancelAnimationFrame(c.raf);
			c.raf = null;
		}
	};

	const settleAt = (pos: number) => {
		const store = storeRef.current;
		const {isLoop, loopOffset, slideCount, slideWidth, gap, centerInset} =
			store;
		store.restOffset = pos;
		store.autoScrollPaused = false;
		const stride = slideWidth + gap;
		/** Boundaries sit at index × stride − centerInset, so the inset re-joins before rounding. */
		let idx =
			stride > 0
				? Math.round((pos + centerInset) / stride) - (isLoop ? loopOffset : 0)
				: store.currentIndex;
		if (isLoop && slideCount > 0)
			idx = ((idx % slideCount) + slideCount) % slideCount;
		goToIndex(idx, 'settle');
	};

	const startCoast = (pos: number, velocity: number) => {
		if (prefersReducedMotion() || Math.abs(velocity) < FREE_MIN_VELOCITY) {
			settleAt(pos);
			return;
		}
		const c = coast.current;
		c.pos = pos;
		c.velocity = velocity;
		c.lastTs = null;

		const step = (ts: number) => {
			if (c.lastTs === null) c.lastTs = ts;
			const dt = ts - c.lastTs;
			c.lastTs = ts;
			c.pos += c.velocity * dt;
			c.velocity *= Math.exp(-dt / FREE_DECAY_MS);
			const store = storeRef.current;
			if (store.isLoop) {
				c.pos = wrapPos(c.pos, store);
			} else {
				const max = maxTrackOffset(store);
				if (c.pos <= 0) {
					c.pos = 0;
					c.velocity = 0;
				} else if (c.pos >= max) {
					c.pos = max;
					c.velocity = 0;
				}
			}
			applyPos(c.pos);
			if (Math.abs(c.velocity) < FREE_MIN_VELOCITY) {
				c.raf = null;
				settleAt(c.pos);
				return;
			}
			c.raf = requestAnimationFrame(step);
		};

		c.raf = requestAnimationFrame(step);
	};

	const onStart = () => {
		const store = storeRef.current;
		store.autoScrollPaused = true;
		/** Grabbing a coasting track catches it: it rests (and drags on) from where it was caught. */
		if (coast.current.raf !== null) {
			stopCoast();
			store.restOffset = coast.current.pos;
		}
		/** Clear any leftover snap transition so the drag tracks the finger 1:1. */
		if (trackRef.current) trackRef.current.style.transition = '';
	};

	const onMove = (dx: number) => {
		applyPos(freePos(dx, storeRef.current));
	};

	const onEnd = (dx: number, velocityX: number, moved: boolean) => {
		const store = storeRef.current;
		/** moved === false is a tap / vertical abandon — nothing to commit. */
		if (!moved) {
			store.autoScrollPaused = false;
			return;
		}
		const {maxIndex, isLoop, loopOffset, slideWidth, gap, centerInset} = store;
		const stride = slideWidth + gap;
		const pos = freePos(dx, store);

		if (snap) {
			store.autoScrollPaused = false;
			if (stride === 0) return;
			const projected = pos - velocityX * FREE_DECAY_MS;
			const idx =
				Math.round((projected + centerInset) / stride) -
				(isLoop ? loopOffset : 0);
			goToIndex(idx, 'drag');
			return;
		}

		/**
		 * A release at (or rubber-banded past) an edge has nowhere to coast — snap back to
		 * the edge boundary through the normal drag path instead.
		 */
		if (!isLoop && (pos <= 0 || pos >= maxTrackOffset(store))) {
			store.autoScrollPaused = false;
			goToIndex(pos <= 0 ? 0 : maxIndex, 'drag');
			return;
		}
		startCoast(pos, -velocityX);
	};

	const onCancel = () => {
		stopCoast();
		storeRef.current.autoScrollPaused = false;
		/** Abort: a same-index drag navigation is the animated return to the resting boundary. */
		goToIndex(storeRef.current.currentIndex, 'drag');
	};

	return usePointerGesture({trackRef, storeRef, onStart, onMove, onEnd, onCancel});
}
