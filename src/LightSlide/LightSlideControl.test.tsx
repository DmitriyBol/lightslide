import React, {createRef} from 'react';

import {act, fireEvent, render} from '@testing-library/react';

import type {AnalyticsEvent} from '../modules/analytics';
import {Analytics} from '../modules/analytics';
import {Autoplay} from '../modules/autoplay';
import {Flow} from '../modules/flow';
import {Slide} from '../Slide/Slide';
import type {LightSlideHandle} from '../types';
import {LightSlide} from './LightSlide';

import '@testing-library/jest-dom';

/** ── IntersectionObserver mock ────────────────────────────────────────────── */
class MockIntersectionObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

/** ── ResizeObserver mock ──────────────────────────────────────────────────── */
class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeAll(() => {
	Object.defineProperty(global, 'IntersectionObserver', {
		writable: true,
		value: MockIntersectionObserver,
	});
	Object.defineProperty(global, 'ResizeObserver', {
		writable: true,
		value: MockResizeObserver,
	});
	HTMLElement.prototype.setPointerCapture = jest.fn();
	HTMLElement.prototype.releasePointerCapture = jest.fn();
});

/** ────────────────────────────────────────────────────────────────────────── */

function makeOnEvent() {
	return jest.fn<void, [AnalyticsEvent]>();
}

function eventsOfType<E extends AnalyticsEvent['event']>(
	onEvent: ReturnType<typeof makeOnEvent>,
	event: E,
): Extract<AnalyticsEvent, {event: E}>[] {
	return onEvent.mock.calls
		.map(([payload]) => payload)
		.filter((p): p is Extract<AnalyticsEvent, {event: E}> => p.event === event);
}

/** Three slides at slidesPerView 1 → positions 0..2 (maxIndex 2). */
type RenderOptions = {
	initialIndex?: number;
	index?: number;
	onIndexChange?: (index: number) => void;
	onEvent?: ReturnType<typeof makeOnEvent>;
	isLoop?: boolean;
	slidesPerView?: number;
	flow?: React.ReactNode;
	autoplay?: React.ReactNode;
};

function renderCarousel(options: RenderOptions = {}) {
	const ref = createRef<LightSlideHandle>();
	const {onEvent, ...props} = options;
	const ui = (overrides: Partial<RenderOptions> = {}) => (
		<LightSlide
			ref={ref}
			analytics={onEvent && <Analytics onEvent={onEvent} />}
			{...props}
			{...overrides}>
			<Slide>
				<div>Slide 1</div>
			</Slide>
			<Slide>
				<div>Slide 2</div>
			</Slide>
			<Slide>
				<div>Slide 3</div>
			</Slide>
		</LightSlide>
	);
	const view = render(ui());
	/** The carousel root (role group/region) — the element the hover/focus listeners sit on. */
	const container = view.container.querySelector(
		'[aria-roledescription="carousel"]',
	);
	if (!container) throw new Error('carousel container not found');
	return {
		ref,
		container,
		rerender: (overrides: Partial<RenderOptions>) =>
			view.rerender(ui(overrides)),
	};
}

describe('LightSlide external control', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	describe('initialIndex', () => {
		it('starts at initialIndex without firing events', () => {
			const onIndexChange = jest.fn();
			const onEvent = makeOnEvent();
			const {ref} = renderCarousel({initialIndex: 2, onIndexChange, onEvent});

			expect(ref.current?.getIndex()).toBe(2);
			expect(onIndexChange).not.toHaveBeenCalled();
			expect(eventsOfType(onEvent, 'carousel_slide')).toHaveLength(0);
		});

		it('clamps an out-of-range initialIndex to maxIndex and reports it', () => {
			const onIndexChange = jest.fn();
			const {ref} = renderCarousel({initialIndex: 99, onIndexChange});

			expect(ref.current?.getIndex()).toBe(2);
			expect(onIndexChange).toHaveBeenCalledWith(2);
		});

		it('never starts below zero', () => {
			const {ref} = renderCarousel({initialIndex: -5});
			expect(ref.current?.getIndex()).toBe(0);
		});
	});

	describe('ref handle', () => {
		it('goTo navigates and fires carousel_slide + onIndexChange, no button/dot events', () => {
			const onIndexChange = jest.fn();
			const onEvent = makeOnEvent();
			const {ref} = renderCarousel({onIndexChange, onEvent});

			act(() => ref.current?.goTo(2));

			expect(ref.current?.getIndex()).toBe(2);
			expect(onIndexChange).toHaveBeenCalledWith(2);
			const slides = eventsOfType(onEvent, 'carousel_slide');
			expect(slides).toHaveLength(1);
			expect(slides[0]).toMatchObject({
				direction: 'right',
				fromIndex: 0,
				toIndex: 2,
			});
			expect(eventsOfType(onEvent, 'carousel_nav_button')).toHaveLength(0);
			expect(eventsOfType(onEvent, 'carousel_pagination_click')).toHaveLength(
				0,
			);
		});

		it('goTo clamps out-of-range targets instead of wrapping', () => {
			const {ref} = renderCarousel({isLoop: true});

			act(() => ref.current?.goTo(99));
			expect(ref.current?.getIndex()).toBe(2);

			act(() => ref.current?.goTo(-3));
			expect(ref.current?.getIndex()).toBe(0);
		});

		it('goTo to the current position is a no-op', () => {
			const onIndexChange = jest.fn();
			const onEvent = makeOnEvent();
			const {ref} = renderCarousel({onIndexChange, onEvent});

			act(() => ref.current?.goTo(0));

			expect(onIndexChange).not.toHaveBeenCalled();
			expect(eventsOfType(onEvent, 'carousel_slide')).toHaveLength(0);
		});

		it('next/prev step one position and clamp at the edges without looping', () => {
			const onEvent = makeOnEvent();
			const {ref} = renderCarousel({onEvent});

			act(() => ref.current?.prev());
			expect(ref.current?.getIndex()).toBe(0);

			act(() => ref.current?.next());
			expect(ref.current?.getIndex()).toBe(1);
			act(() => ref.current?.next());
			act(() => ref.current?.next());
			expect(ref.current?.getIndex()).toBe(2);

			expect(eventsOfType(onEvent, 'carousel_slide')).toHaveLength(2);
		});

		it('next/prev wrap around when isLoop is on', () => {
			const {ref} = renderCarousel({isLoop: true});

			act(() => ref.current?.prev());
			expect(ref.current?.getIndex()).toBe(2);

			act(() => ref.current?.next());
			expect(ref.current?.getIndex()).toBe(0);
		});

		it('goTo lands on the reached-end terminal like user navigation', () => {
			const onEvent = makeOnEvent();
			const {ref} = renderCarousel({onEvent});

			act(() => ref.current?.goTo(2));

			expect(eventsOfType(onEvent, 'carousel_reached_end')).toHaveLength(1);
		});
	});

	describe('controlled index', () => {
		it('mounts at the controlled index without firing events', () => {
			const onEvent = makeOnEvent();
			const {ref} = renderCarousel({index: 1, onEvent});

			expect(ref.current?.getIndex()).toBe(1);
			expect(eventsOfType(onEvent, 'carousel_slide')).toHaveLength(0);
		});

		it('navigates when the index prop changes', () => {
			const onEvent = makeOnEvent();
			const {ref, rerender} = renderCarousel({index: 0, onEvent});

			act(() => rerender({index: 2}));

			expect(ref.current?.getIndex()).toBe(2);
			const slides = eventsOfType(onEvent, 'carousel_slide');
			expect(slides).toHaveLength(1);
			expect(slides[0]).toMatchObject({fromIndex: 0, toIndex: 2});
		});

		it('clamps an out-of-range controlled index', () => {
			const {ref, rerender} = renderCarousel({index: 0});

			act(() => rerender({index: 42}));

			expect(ref.current?.getIndex()).toBe(2);
		});

		it('echoing onIndexChange back into index does not re-navigate', () => {
			const onEvent = makeOnEvent();
			const {ref, rerender} = renderCarousel({index: 0, onEvent});

			act(() => ref.current?.next());
			expect(ref.current?.getIndex()).toBe(1);
			/** Parent echoes the change back, as a controlled consumer would. */
			act(() => rerender({index: 1}));

			expect(ref.current?.getIndex()).toBe(1);
			expect(eventsOfType(onEvent, 'carousel_slide')).toHaveLength(1);
		});
	});

	describe('onIndexChange', () => {
		it('fires when a layout change clamps the current position', () => {
			const onIndexChange = jest.fn();
			const {ref, rerender} = renderCarousel({onIndexChange});

			act(() => ref.current?.goTo(2));
			onIndexChange.mockClear();

			/** slidesPerView 3 → maxIndex 0, so position 2 no longer exists. */
			act(() => rerender({slidesPerView: 3}));

			expect(ref.current?.getIndex()).toBe(0);
			expect(onIndexChange).toHaveBeenCalledWith(0);
		});
	});

	describe('pause / resume', () => {
		const autoplay = <Autoplay interval={1000} />;

		it('pause() holds autoplay and resume() restarts it', () => {
			const {ref} = renderCarousel({autoplay});

			act(() => jest.advanceTimersByTime(1000));
			expect(ref.current?.getIndex()).toBe(1);

			act(() => ref.current?.pause());
			act(() => jest.advanceTimersByTime(3000));
			expect(ref.current?.getIndex()).toBe(1);

			act(() => ref.current?.resume());
			act(() => jest.advanceTimersByTime(1000));
			expect(ref.current?.getIndex()).toBe(2);
		});

		it('manual navigation keeps working while paused', () => {
			const {ref} = renderCarousel({autoplay});

			act(() => ref.current?.pause());
			act(() => ref.current?.next());
			expect(ref.current?.getIndex()).toBe(1);
		});

		it('hovering the carousel holds autoplay; leaving resumes it', () => {
			const {ref, container} = renderCarousel({autoplay});

			fireEvent.pointerEnter(container, {pointerType: 'mouse'});
			act(() => jest.advanceTimersByTime(3000));
			expect(ref.current?.getIndex()).toBe(0);

			fireEvent.pointerLeave(container, {pointerType: 'mouse'});
			act(() => jest.advanceTimersByTime(1000));
			expect(ref.current?.getIndex()).toBe(1);
		});

		it('focus inside the carousel holds autoplay; blur out resumes it', () => {
			const {ref, container} = renderCarousel({autoplay});

			fireEvent.focusIn(container);
			act(() => jest.advanceTimersByTime(3000));
			expect(ref.current?.getIndex()).toBe(0);

			fireEvent.focusOut(container, {relatedTarget: document.body});
			act(() => jest.advanceTimersByTime(1000));
			expect(ref.current?.getIndex()).toBe(1);
		});

		it('hover does not hold autoplay when pauseOnHover is false', () => {
			const {ref, container} = renderCarousel({
				autoplay: <Autoplay interval={1000} pauseOnHover={false} />,
			});

			fireEvent.pointerEnter(container, {pointerType: 'mouse'});
			act(() => jest.advanceTimersByTime(1000));
			expect(ref.current?.getIndex()).toBe(1);
		});
	});

	describe('flow mode', () => {
		it('ignores programmatic navigation while the flow owns the track', () => {
			const onIndexChange = jest.fn();
			const onEvent = makeOnEvent();
			const {ref, rerender} = renderCarousel({
				onIndexChange,
				onEvent,
				flow: <Flow />,
			});

			act(() => ref.current?.goTo(2));
			act(() => ref.current?.next());
			act(() => rerender({flow: <Flow />, index: 2}));

			expect(ref.current?.getIndex()).toBe(0);
			expect(onIndexChange).not.toHaveBeenCalled();
			expect(eventsOfType(onEvent, 'carousel_slide')).toHaveLength(0);
		});
	});
});
