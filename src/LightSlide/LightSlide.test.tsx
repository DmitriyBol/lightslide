import React from 'react';

import {act, render, screen} from '@testing-library/react';

import {Slide} from '../Slide/Slide';
import type {AnalyticsEvent} from '../types';
import {LightSlide} from './LightSlide';

import '@testing-library/jest-dom';

// ── IntersectionObserver mock ──────────────────────────────────────────────
type IOCallback = (entries: IntersectionObserverEntry[]) => void;
let triggerIO: (isIntersecting: boolean) => void = () => {};

class MockIntersectionObserver {
	constructor(private cb: IOCallback) {
		triggerIO = (isIntersecting: boolean) => {
			cb([{isIntersecting} as IntersectionObserverEntry]);
		};
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

// ── ResizeObserver mock ────────────────────────────────────────────────────
class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// ── Pointer-capture stubs (not implemented in jsdom) ──────────────────────
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

// ──────────────────────────────────────────────────────────────────────────

// All analytics now flows through one onEvent handler. A typed mock plus this filter let
// each test pull out the events of a given kind (and read their narrowed payload fields).
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

function renderLightSlide(
	onEvent?: (payload: AnalyticsEvent) => void,
	viewedTimeout: number | undefined = 30,
	slidesPerView = 1,
) {
	return render(
		<LightSlide
			analytics={onEvent ? {onEvent, viewedTimeout} : undefined}
			slidesPerView={slidesPerView}>
			<Slide data={{id: 1, name: 'Slide 1'}}>
				<div>Slide 1</div>
			</Slide>
			<Slide data={{id: 2, name: 'Slide 2'}}>
				<div>Slide 2</div>
			</Slide>
			<Slide data={{id: 3, name: 'Slide 3'}}>
				<div>Slide 3</div>
			</Slide>
		</LightSlide>,
	);
}

describe('LightSlide', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('renders all slides', () => {
		renderLightSlide();
		expect(screen.getByText('Slide 1')).toBeInTheDocument();
		expect(screen.getByText('Slide 2')).toBeInTheDocument();
		expect(screen.getByText('Slide 3')).toBeInTheDocument();
	});

	it('fires carousel_in_viewport once when carousel enters viewport', () => {
		const onEvent = makeOnEvent();
		renderLightSlide(onEvent);

		act(() => triggerIO(true));

		const inViewport = eventsOfType(onEvent, 'carousel_in_viewport');
		expect(inViewport).toHaveLength(1);
		expect(inViewport[0].event).toBe('carousel_in_viewport');
	});

	it('fires carousel_in_viewport only once even on repeated IO triggers', () => {
		const onEvent = makeOnEvent();
		renderLightSlide(onEvent);

		act(() => triggerIO(true));
		act(() => triggerIO(false));
		act(() => triggerIO(true));

		expect(eventsOfType(onEvent, 'carousel_in_viewport')).toHaveLength(1);
	});

	it('fires carousel_viewed_slides after timeout and not carousel_reached_end', () => {
		const onEvent = makeOnEvent();
		renderLightSlide(onEvent, 30);

		act(() => triggerIO(true));
		act(() => jest.advanceTimersByTime(30_000));

		const viewed = eventsOfType(onEvent, 'carousel_viewed_slides');
		expect(viewed).toHaveLength(1);
		expect(eventsOfType(onEvent, 'carousel_reached_end')).toHaveLength(0);
		expect(viewed[0].slides.length).toBeGreaterThan(0);
	});

	it('does not fire carousel_viewed_slides before timeout elapses', () => {
		const onEvent = makeOnEvent();
		renderLightSlide(onEvent, 30);

		act(() => triggerIO(true));
		act(() => jest.advanceTimersByTime(10_000));

		expect(eventsOfType(onEvent, 'carousel_viewed_slides')).toHaveLength(0);
	});

	it('renders correct number of slides regardless of slidesPerView', () => {
		renderLightSlide(undefined, 30, 2);
		expect(screen.getByText('Slide 1')).toBeInTheDocument();
		expect(screen.getByText('Slide 2')).toBeInTheDocument();
		expect(screen.getByText('Slide 3')).toBeInTheDocument();
	});
});

describe('LightSlide — isLoop', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('renders all real slide content even when clones are added', () => {
		render(
			<LightSlide isLoop>
				<Slide>Alpha</Slide>
				<Slide>Beta</Slide>
				<Slide>Gamma</Slide>
			</LightSlide>,
		);
		// Real slides are present (clones may add duplicates, so check getAllByText)
		expect(screen.getAllByText('Alpha').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('Beta').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('Gamma').length).toBeGreaterThanOrEqual(1);
	});

	it('does not disable navigation buttons at first or last index when isLoop is true', () => {
		render(
			<LightSlide isLoop navigation={{}}>
				<Slide>A</Slide>
				<Slide>B</Slide>
				<Slide>C</Slide>
			</LightSlide>,
		);
		expect(screen.getByLabelText('Previous slide')).not.toBeDisabled();
		expect(screen.getByLabelText('Next slide')).not.toBeDisabled();
	});

	it('does not fire carousel_reached_end when isLoop is active', () => {
		const onEvent = makeOnEvent();
		render(
			<LightSlide isLoop analytics={{onEvent}} navigation={{}}>
				<Slide>A</Slide>
				<Slide>B</Slide>
				<Slide>C</Slide>
			</LightSlide>,
		);
		// At maxIndex with isLoop, the reached-end terminal must never fire (loop wrap suppresses it).
		expect(eventsOfType(onEvent, 'carousel_reached_end')).toHaveLength(0);
	});
});

describe('LightSlide — loading fallback', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('renders no slides (and nothing) while loading with no fallback', () => {
		render(
			<LightSlide loading slidesPerView={3}>
				<Slide>Alpha</Slide>
				<Slide>Beta</Slide>
				<Slide>Gamma</Slide>
			</LightSlide>,
		);
		expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
		expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
	});

	it('renders a custom fallback node while loading', () => {
		render(
			<LightSlide loading fallback={<div>Loading products…</div>}>
				<Slide>Alpha</Slide>
			</LightSlide>,
		);
		expect(screen.getByText('Loading products…')).toBeInTheDocument();
		expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
	});

	it('hides navigation and pagination while loading', () => {
		render(
			<LightSlide loading navigation={{}} pagination={{}}>
				<Slide>Alpha</Slide>
				<Slide>Beta</Slide>
			</LightSlide>,
		);
		expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
		expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
	});

	it('shows the real slides once loading clears', () => {
		const {rerender} = render(
			<LightSlide loading>
				<Slide>Alpha</Slide>
				<Slide>Beta</Slide>
			</LightSlide>,
		);
		expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

		rerender(
			<LightSlide loading={false}>
				<Slide>Alpha</Slide>
				<Slide>Beta</Slide>
			</LightSlide>,
		);
		expect(screen.getByText('Alpha')).toBeInTheDocument();
	});
});

describe('LightSlide — viewed-slides opt-in', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('is silent (no console output) when no analytics prop is provided', () => {
		const spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
		const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});

		render(
			<LightSlide>
				<Slide>A</Slide>
				<Slide>B</Slide>
			</LightSlide>,
		);
		act(() => triggerIO(true));
		act(() => jest.advanceTimersByTime(60_000));

		expect(spyLog).not.toHaveBeenCalled();
		expect(spyWarn).not.toHaveBeenCalled();
		expect(spyError).not.toHaveBeenCalled();
		spyLog.mockRestore();
		spyWarn.mockRestore();
		spyError.mockRestore();
	});

	it('does not fire carousel_viewed_slides when viewedTimeout is omitted (timer never starts)', () => {
		const onEvent = makeOnEvent();
		// Provide onEvent but NOT viewedTimeout — viewed tracking must stay off.
		render(
			<LightSlide analytics={{onEvent}}>
				<Slide>A</Slide>
				<Slide>B</Slide>
			</LightSlide>,
		);

		act(() => triggerIO(true));
		act(() => jest.advanceTimersByTime(60_000));

		expect(eventsOfType(onEvent, 'carousel_viewed_slides')).toHaveLength(0);
		// carousel_in_viewport still fires — it is independent of viewed tracking.
		expect(eventsOfType(onEvent, 'carousel_in_viewport')).toHaveLength(1);
	});
});

describe('LightSlide — flow', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('enables loop clones automatically when flow is on (without isLoop)', () => {
		render(
			<LightSlide flow={{enabled: true}}>
				<Slide>Alpha</Slide>
				<Slide>Beta</Slide>
				<Slide>Gamma</Slide>
			</LightSlide>,
		);
		expect(screen.getAllByText('Alpha').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('Beta').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText('Gamma').length).toBeGreaterThanOrEqual(1);
	});

	it('does not fire carousel_reached_end while the flow is running', () => {
		const onEvent = makeOnEvent();
		render(
			<LightSlide flow={{enabled: true}} analytics={{onEvent}}>
				<Slide>A</Slide>
				<Slide>B</Slide>
				<Slide>C</Slide>
			</LightSlide>,
		);
		expect(eventsOfType(onEvent, 'carousel_reached_end')).toHaveLength(0);
	});
});

describe('LightSlide — typed data chain', () => {
	type Product = {id: number; name: string};

	it('types the analytics payload slide data as the LightSlide type argument', () => {
		const names: string[] = [];
		render(
			<LightSlide<Product>
				analytics={{
					// Narrowing on `event` gives `slides: SlideData<Product>[]`, so `s.data.name`
					// only compiles because the type parameter flows through the chain.
					onEvent: e => {
						if (
							e.event === 'carousel_reached_end' ||
							e.event === 'carousel_viewed_slides'
						) {
							for (const s of e.slides) if (s.data) names.push(s.data.name);
						}
					},
				}}>
				<Slide<Product> data={{id: 1, name: 'A'}}>A</Slide>
				<Slide<Product> data={{id: 2, name: 'B'}}>B</Slide>
			</LightSlide>,
		);
		expect(screen.getByText('A')).toBeInTheDocument();
	});
});
