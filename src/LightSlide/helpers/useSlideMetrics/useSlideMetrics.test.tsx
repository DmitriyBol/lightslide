import {act, renderHook} from '@testing-library/react';
import type {RefObject} from 'react';

import {createStore} from '../store';
import {useSlideMetrics} from './useSlideMetrics';

/**
 * useSlideMetrics is the SOLE writer of store.slideWidth (fixed mode) and store.slideOffsets
 * (variable-width `auto` mode) — the geometry the flow rAF loop, the drag gesture, and the snap
 * math all read instead of touching the DOM. These tests pin the produce/refresh contract those
 * consumers depend on (their own tests pre-seed the values).
 */

/** Capture the ResizeObserver callback so a resize can be driven manually (jsdom has none). */
let roCallback: ResizeObserverCallback | null = null;
class MockResizeObserver {
	constructor(cb: ResizeObserverCallback) {
		roCallback = cb;
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

function setOffsetWidth(el: HTMLElement, offsetWidth: number) {
	Object.defineProperty(el, 'offsetWidth', {
		configurable: true,
		value: offsetWidth,
	});
}

function container(offsetWidth: number) {
	const el = document.createElement('div');
	setOffsetWidth(el, offsetWidth);
	return el;
}

/** A track whose children report the given main-axis sizes (jsdom measures 0 otherwise). */
function track(...sizes: number[]): RefObject<HTMLDivElement | null> {
	const el = document.createElement('div');
	for (const size of sizes) {
		const child = document.createElement('div');
		setOffsetWidth(child, size);
		el.appendChild(child);
	}
	return {current: el};
}

const noTrack: RefObject<HTMLDivElement | null> = {current: null};

describe('useSlideMetrics', () => {
	beforeEach(() => {
		roCallback = null;
		Object.defineProperty(global, 'ResizeObserver', {
			writable: true,
			configurable: true,
			value: MockResizeObserver,
		});
	});

	describe('fixed mode', () => {
		it('mirrors floor(offsetWidth / slidesPerView) onto the store and state on mount', () => {
			const storeRef = {current: createStore({slidesPerView: 2})};
			const {result} = renderHook(() =>
				useSlideMetrics({current: container(600)}, noTrack, storeRef, false, false),
			);
			/** 600 / 2 = 300, the value every motion/gesture/snap path now reads. */
			expect(storeRef.current.slideWidth).toBe(300);
			expect(result.current.slideWidth).toBe(300);
		});

		it('floors a non-integer per-slide width so the transform stays pixel-aligned', () => {
			const storeRef = {current: createStore({slidesPerView: 3})};
			renderHook(() =>
				useSlideMetrics({current: container(1000)}, noTrack, storeRef, false, false),
			);
			/** 1000 / 3 = 333.33… → floored to 333. */
			expect(storeRef.current.slideWidth).toBe(333);
		});

		it('subtracts the visible gaps before dividing when gap is set', () => {
			/** 2 per view shows 1 gap: (620 − 20) / 2 = 300. */
			const storeRef = {current: createStore({slidesPerView: 2, gap: 20})};
			renderHook(() =>
				useSlideMetrics({current: container(620)}, noTrack, storeRef, false, false),
			);
			expect(storeRef.current.slideWidth).toBe(300);
		});

		it('counts ceil(slidesPerView) − 1 gaps for a fractional view', () => {
			/** 1.5 per view still shows the full gap before the half slide: (620 − 20) / 1.5 = 400. */
			const storeRef = {current: createStore({slidesPerView: 1.5, gap: 20})};
			renderHook(() =>
				useSlideMetrics({current: container(620)}, noTrack, storeRef, false, false),
			);
			expect(storeRef.current.slideWidth).toBe(400);
		});

		it('never goes below zero when the gaps exceed the container', () => {
			const storeRef = {current: createStore({slidesPerView: 2, gap: 700})};
			renderHook(() =>
				useSlideMetrics({current: container(600)}, noTrack, storeRef, false, false),
			);
			expect(storeRef.current.slideWidth).toBe(0);
		});

		it('measures the centring inset alongside the width in center mode', () => {
			/** 1.5 per view centred: slide 400 → inset (600 − 400) / 2 = 100. */
			const storeRef = {current: createStore({slidesPerView: 1.5})};
			renderHook(() =>
				useSlideMetrics({current: container(600)}, noTrack, storeRef, true, false),
			);
			expect(storeRef.current.slideWidth).toBe(400);
			expect(storeRef.current.centerInset).toBe(100);
		});

		it('zeroes the inset when not centred', () => {
			const storeRef = {
				current: createStore({slidesPerView: 1.5, centerInset: 100}),
			};
			renderHook(() =>
				useSlideMetrics({current: container(600)}, noTrack, storeRef, false, false),
			);
			expect(storeRef.current.centerInset).toBe(0);
		});

		it('measures offsetHeight instead of offsetWidth on the vertical axis', () => {
			const el = document.createElement('div');
			setOffsetWidth(el, 600);
			Object.defineProperty(el, 'offsetHeight', {
				configurable: true,
				value: 420,
			});
			const storeRef = {
				current: createStore({slidesPerView: 2, vertical: true}),
			};
			renderHook(() => useSlideMetrics({current: el}, noTrack, storeRef, false, false));
			/** 420 / 2 = 210 — the height, not the 600px width. */
			expect(storeRef.current.slideWidth).toBe(210);
		});

		it('re-measures into the store and state when the ResizeObserver fires', () => {
			const el = container(600);
			const storeRef = {current: createStore({slidesPerView: 2})};
			const {result} = renderHook(() =>
				useSlideMetrics({current: el}, noTrack, storeRef, false, false),
			);
			expect(storeRef.current.slideWidth).toBe(300);

			/** Container grows → the ResizeObserver callback re-measures. */
			setOffsetWidth(el, 900);
			act(() => roCallback?.([], {} as ResizeObserver));
			expect(storeRef.current.slideWidth).toBe(450);
			expect(result.current.slideWidth).toBe(450);
		});
	});

	describe('variable-width (auto) mode', () => {
		it('builds cumulative slideOffsets from each track child and stores the viewport size', () => {
			const storeRef = {current: createStore()};
			renderHook(() =>
				useSlideMetrics(
					{current: container(500)},
					track(100, 300, 200),
					storeRef,
					false,
					true,
				),
			);
			expect(storeRef.current.slideOffsets).toEqual([0, 100, 400, 600]);
			expect(storeRef.current.viewportSize).toBe(500);
			/** No single slide size — slides keep their content width. */
			expect(storeRef.current.slideWidth).toBe(0);
		});

		it('folds the gap into every step of the auto offsets', () => {
			const storeRef = {current: createStore({gap: 20})};
			renderHook(() =>
				useSlideMetrics(
					{current: container(500)},
					track(100, 300, 200),
					storeRef,
					false,
					true,
				),
			);
			expect(storeRef.current.slideOffsets).toEqual([0, 120, 440, 660]);
		});

		it('re-measures the offsets when a slide resizes (ResizeObserver on the track)', () => {
			const t = track(100, 300, 200);
			const storeRef = {current: createStore()};
			renderHook(() =>
				useSlideMetrics({current: container(500)}, t, storeRef, false, true),
			);
			expect(storeRef.current.slideOffsets).toEqual([0, 100, 400, 600]);

			const grown = t.current?.children[1] as HTMLElement | undefined;
			if (grown) setOffsetWidth(grown, 500);
			act(() => roCallback?.([], {} as ResizeObserver));
			expect(storeRef.current.slideOffsets).toEqual([0, 100, 600, 800]);
		});
	});
});
