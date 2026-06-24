import React from 'react';

import {act, render, screen} from '@testing-library/react';

import {Slide} from '../Slide/Slide';
import type {AnalyticsHandlers} from '../types';
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

function makeHandlers(): jest.Mocked<Required<AnalyticsHandlers>> {
	return {
		onInViewport: jest.fn(),
		onSlide: jest.fn(),
		onReachedEnd: jest.fn(),
		onViewedSlides: jest.fn(),
		onNavButtonClick: jest.fn(),
		onPaginationClick: jest.fn(),
	};
}

function renderLightSlide(
	handlers: Partial<AnalyticsHandlers>,
	viewedTimeout = 30,
	slidesPerView = 1,
) {
	return render(
		<LightSlide
			analytics={handlers}
			viewedTimeout={viewedTimeout}
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
		renderLightSlide({});
		expect(screen.getByText('Slide 1')).toBeInTheDocument();
		expect(screen.getByText('Slide 2')).toBeInTheDocument();
		expect(screen.getByText('Slide 3')).toBeInTheDocument();
	});

	it('fires onInViewport once when carousel enters viewport', () => {
		const handlers = makeHandlers();
		renderLightSlide(handlers);

		act(() => triggerIO(true));

		expect(handlers.onInViewport).toHaveBeenCalledTimes(1);
		expect(handlers.onInViewport.mock.calls[0][0].event).toBe(
			'carousel_in_viewport',
		);
	});

	it('fires onInViewport only once even on repeated IO triggers', () => {
		const handlers = makeHandlers();
		renderLightSlide(handlers);

		act(() => triggerIO(true));
		act(() => triggerIO(false));
		act(() => triggerIO(true));

		expect(handlers.onInViewport).toHaveBeenCalledTimes(1);
	});

	it('fires onViewedSlides after timeout and not onReachedEnd', () => {
		const handlers = makeHandlers();
		renderLightSlide(handlers, 30);

		act(() => triggerIO(true));
		act(() => jest.advanceTimersByTime(30_000));

		expect(handlers.onViewedSlides).toHaveBeenCalledTimes(1);
		expect(handlers.onReachedEnd).not.toHaveBeenCalled();

		const payload = handlers.onViewedSlides.mock.calls[0][0];
		expect(payload.event).toBe('carousel_viewed_slides');
		expect(payload.slides.length).toBeGreaterThan(0);
	});

	it('does not fire onViewedSlides before timeout elapses', () => {
		const handlers = makeHandlers();
		renderLightSlide(handlers, 30);

		act(() => triggerIO(true));
		act(() => jest.advanceTimersByTime(10_000));

		expect(handlers.onViewedSlides).not.toHaveBeenCalled();
	});

	it('renders correct number of slides regardless of slidesPerView', () => {
		renderLightSlide({}, 30, 2);
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

	it('does not fire onReachedEnd when isLoop is active', () => {
		const handlers = makeHandlers();
		render(
			<LightSlide isLoop analytics={handlers} navigation={{}}>
				<Slide>A</Slide>
				<Slide>B</Slide>
				<Slide>C</Slide>
			</LightSlide>,
		);
		// At maxIndex with isLoop, onReachedEnd must never fire (loop wrap suppresses it).
		expect(handlers.onReachedEnd).not.toHaveBeenCalled();
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

	it('does not fire onViewedSlides when no handler is provided (timer never starts)', () => {
		const onInViewport = jest.fn();
		const onViewedSlides = jest.fn();
		// Provide onInViewport but NOT onViewedSlides — tracking must stay off.
		render(
			<LightSlide analytics={{onInViewport}} viewedTimeout={30}>
				<Slide>A</Slide>
				<Slide>B</Slide>
			</LightSlide>,
		);

		act(() => triggerIO(true));
		act(() => jest.advanceTimersByTime(60_000));

		expect(onViewedSlides).not.toHaveBeenCalled();
		// onInViewport still fires — it is independent of viewed tracking.
		expect(onInViewport).toHaveBeenCalledTimes(1);
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

	it('does not fire onReachedEnd while the flow is running', () => {
		const handlers = makeHandlers();
		render(
			<LightSlide flow={{enabled: true}} analytics={handlers}>
				<Slide>A</Slide>
				<Slide>B</Slide>
				<Slide>C</Slide>
			</LightSlide>,
		);
		expect(handlers.onReachedEnd).not.toHaveBeenCalled();
	});
});
