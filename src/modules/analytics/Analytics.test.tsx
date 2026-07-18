import {createRef} from 'react';

import {act, render} from '@testing-library/react';

import {LightSlide} from '../../LightSlide/LightSlide';
import {Slide} from '../../Slide/Slide';
import type {LightSlideHandle} from '../../types';
import {Analytics} from './Analytics';
import type {AnalyticsEvent} from './Analytics.types';

/** ── IntersectionObserver / ResizeObserver mocks (not implemented in jsdom) ── */
class MockIntersectionObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}
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
});

function renderCarousel(
	onEvent: (payload: AnalyticsEvent<string>) => void,
	options: {
		isLoop?: boolean;
		initialIndex?: number;
		dir?: 'ltr' | 'rtl';
		axis?: 'x' | 'y';
	} = {},
) {
	const handle = createRef<LightSlideHandle>();
	const view = render(
		<LightSlide
			ref={handle}
			label="Cards"
			isLoop={options.isLoop}
			initialIndex={options.initialIndex}
			dir={options.dir}
			axis={options.axis}
			analytics={<Analytics<string> onEvent={onEvent} />}>
			<Slide<string> data="one">
				<div>One</div>
			</Slide>
			<Slide<string> data="two">
				<div>Two</div>
			</Slide>
			<Slide<string> data="three">
				<div>Three</div>
			</Slide>
		</LightSlide>,
	);
	return {handle, view};
}

describe('Analytics', () => {
	it('reports a navigation as carousel_slide with the visual direction', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const {handle} = renderCarousel(onEvent);

		act(() => handle.current?.goTo(1));

		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'right',
			fromIndex: 0,
			toIndex: 1,
		});
	});

	it('fires carousel_reached_end with every slide and its data at maxIndex', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const {handle} = renderCarousel(onEvent);

		act(() => handle.current?.goTo(2));

		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_reached_end',
			slides: [
				{index: 0, data: 'one'},
				{index: 1, data: 'two'},
				{index: 2, data: 'three'},
			],
		});
	});

	it('reports a forward loop wrap as rightward motion and never as reaching the end', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const {handle} = renderCarousel(onEvent, {isLoop: true, initialIndex: 2});

		act(() => handle.current?.next());

		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'right',
			fromIndex: 2,
			toIndex: 0,
		});
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).not.toContain('carousel_reached_end');
	});

	it('reports rtl forward motion as "left" yet still recognises reaching the end', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const {handle} = renderCarousel(onEvent, {dir: 'rtl'});

		act(() => handle.current?.goTo(2));

		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'left',
			fromIndex: 0,
			toIndex: 2,
		});
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).toContain('carousel_reached_end');
	});

	it('reports an rtl forward loop wrap as leftward motion and never as reaching the end', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const {handle} = renderCarousel(onEvent, {
			isLoop: true,
			initialIndex: 2,
			dir: 'rtl',
		});

		act(() => handle.current?.next());

		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'left',
			fromIndex: 2,
			toIndex: 0,
		});
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).not.toContain('carousel_reached_end');
	});

	it('reports vertical forward motion as "down" yet still recognises reaching the end', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const {handle} = renderCarousel(onEvent, {axis: 'y'});

		act(() => handle.current?.goTo(2));

		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'down',
			fromIndex: 0,
			toIndex: 2,
		});
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).toContain('carousel_reached_end');
	});

	it('reports a vertical forward loop wrap as downward motion and never as reaching the end', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const {handle} = renderCarousel(onEvent, {
			axis: 'y',
			isLoop: true,
			initialIndex: 2,
		});

		act(() => handle.current?.next());

		expect(onEvent).toHaveBeenCalledWith({
			event: 'carousel_slide',
			direction: 'down',
			fromIndex: 2,
			toIndex: 0,
		});
		const kinds = onEvent.mock.calls.map(([event]) => event.event);
		expect(kinds).not.toContain('carousel_reached_end');
	});

	it('stops reporting once the plugin unmounts (emitNav cleared)', () => {
		const onEvent = jest.fn<void, [AnalyticsEvent<string>]>();
		const handle = createRef<LightSlideHandle>();
		const slides = [
			<Slide key="a">
				<div>One</div>
			</Slide>,
			<Slide key="b">
				<div>Two</div>
			</Slide>,
		];
		const {rerender} = render(
			<LightSlide
				ref={handle}
				label="Cards"
				analytics={<Analytics onEvent={onEvent} />}>
				{slides}
			</LightSlide>,
		);

		rerender(
			<LightSlide ref={handle} label="Cards">
				{slides}
			</LightSlide>,
		);
		act(() => handle.current?.goTo(1));

		expect(onEvent).not.toHaveBeenCalled();
	});

	it('fails loudly outside <LightSlide analytics={…}>', () => {
		/** React logs the render-phase throw — silence the expected noise. */
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		expect(() => render(<Analytics onEvent={() => {}} />)).toThrow(
			'lightslide/analytics must be passed to <LightSlide analytics={…}>',
		);
		consoleError.mockRestore();
	});
});
