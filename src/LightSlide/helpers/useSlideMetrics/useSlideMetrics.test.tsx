import {act, renderHook} from '@testing-library/react';

import {createStore} from '../store';
import {useSlideMetrics} from './useSlideMetrics';

/**
 * useSlideMetrics is the SOLE writer of store.slideWidth — the cached width the flow rAF loop,
 * the drag gesture, and the snap math all read instead of touching the DOM. These tests pin the
 * produce/refresh contract those consumers depend on (their own tests pre-seed slideWidth).
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

function container(offsetWidth: number) {
	const el = document.createElement('div');
	setOffsetWidth(el, offsetWidth);
	return el;
}

function setOffsetWidth(el: HTMLElement, offsetWidth: number) {
	Object.defineProperty(el, 'offsetWidth', {
		configurable: true,
		value: offsetWidth,
	});
}

describe('useSlideMetrics', () => {
	beforeEach(() => {
		roCallback = null;
		Object.defineProperty(global, 'ResizeObserver', {
			writable: true,
			configurable: true,
			value: MockResizeObserver,
		});
	});

	it('mirrors floor(offsetWidth / slidesPerView) onto the store and state on mount', () => {
		const storeRef = {current: createStore({slidesPerView: 2})};
		const {result} = renderHook(() =>
			useSlideMetrics({current: container(600)}, storeRef, false),
		);
		/** 600 / 2 = 300, the value every motion/gesture/snap path now reads. */
		expect(storeRef.current.slideWidth).toBe(300);
		expect(result.current.slideWidth).toBe(300);
	});

	it('floors a non-integer per-slide width so the transform stays pixel-aligned', () => {
		const storeRef = {current: createStore({slidesPerView: 3})};
		renderHook(() => useSlideMetrics({current: container(1000)}, storeRef, false));
		/** 1000 / 3 = 333.33… → floored to 333. */
		expect(storeRef.current.slideWidth).toBe(333);
	});

	it('subtracts the visible gaps before dividing when gap is set', () => {
		/** 2 per view shows 1 gap: (620 − 20) / 2 = 300. */
		const storeRef = {current: createStore({slidesPerView: 2, gap: 20})};
		renderHook(() => useSlideMetrics({current: container(620)}, storeRef, false));
		expect(storeRef.current.slideWidth).toBe(300);
	});

	it('counts ceil(slidesPerView) − 1 gaps for a fractional view', () => {
		/** 1.5 per view still shows the full gap before the half slide: (620 − 20) / 1.5 = 400. */
		const storeRef = {current: createStore({slidesPerView: 1.5, gap: 20})};
		renderHook(() => useSlideMetrics({current: container(620)}, storeRef, false));
		expect(storeRef.current.slideWidth).toBe(400);
	});

	it('never goes below zero when the gaps exceed the container', () => {
		const storeRef = {current: createStore({slidesPerView: 2, gap: 700})};
		renderHook(() => useSlideMetrics({current: container(600)}, storeRef, false));
		expect(storeRef.current.slideWidth).toBe(0);
	});

	it('measures the centring inset alongside the width in center mode', () => {
		/** 1.5 per view centred: slide 400 → inset (600 − 400) / 2 = 100. */
		const storeRef = {current: createStore({slidesPerView: 1.5})};
		renderHook(() =>
			useSlideMetrics({current: container(600)}, storeRef, true),
		);
		expect(storeRef.current.slideWidth).toBe(400);
		expect(storeRef.current.centerInset).toBe(100);
	});

	it('zeroes the inset when not centred', () => {
		const storeRef = {
			current: createStore({slidesPerView: 1.5, centerInset: 100}),
		};
		renderHook(() =>
			useSlideMetrics({current: container(600)}, storeRef, false),
		);
		expect(storeRef.current.centerInset).toBe(0);
	});

	it('re-measures into the store and state when the ResizeObserver fires', () => {
		const el = container(600);
		const storeRef = {current: createStore({slidesPerView: 2})};
		const {result} = renderHook(() => useSlideMetrics({current: el}, storeRef, false));
		expect(storeRef.current.slideWidth).toBe(300);

		/** Container grows → the ResizeObserver callback re-measures. */
		setOffsetWidth(el, 900);
		act(() => roCallback?.([], {} as ResizeObserver));
		expect(storeRef.current.slideWidth).toBe(450);
		expect(result.current.slideWidth).toBe(450);
	});
});
