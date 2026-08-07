import {createRef} from 'react';

import {act, render, screen} from '@testing-library/react';

import {LightSlide} from '../../LightSlide/LightSlide';
import {Slide} from '../../Slide/Slide';
import type {LightSlideHandle} from '../../types';
import {AutoHeight} from './AutoHeight';

import '@testing-library/jest-dom';

/**
 * AutoHeight wiring, end to end in jsdom: seam registration → active-slide measure → inline
 * viewport height. jsdom lays nothing out, so the prototype getter below resolves an
 * element's offsetHeight from its inline `height` style — the way these tests declare
 * per-slide heights.
 */

/** Captures the observer callbacks so a resize can be driven manually (jsdom has none). */
let roCallbacks: ResizeObserverCallback[] = [];
class MockResizeObserver {
	constructor(cb: ResizeObserverCallback) {
		roCallbacks.push(cb);
	}
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeAll(() => {
	Object.defineProperty(global, 'ResizeObserver', {
		writable: true,
		value: MockResizeObserver,
	});
	Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
		configurable: true,
		get(this: HTMLElement) {
			return Number.parseFloat(this.style.height) || 0;
		},
	});
});

const slides = [
	<Slide key="one" style={{height: 100}}>
		<div>One</div>
	</Slide>,
	<Slide key="two" style={{height: 150}}>
		<div>Two</div>
	</Slide>,
	<Slide key="three" style={{height: 200}}>
		<div>Three</div>
	</Slide>,
];

function renderCarousel(props: {loop?: boolean; axis?: 'x' | 'y'} = {}) {
	const handle = createRef<LightSlideHandle>();
	const view = render(
		<LightSlide label="Cards" autoHeight={<AutoHeight />} ref={handle} {...props}>
			{slides}
		</LightSlide>,
	);
	return {handle, view};
}

/** slide → track → viewport (the clipping box whose height the plugin drives). */
function getViewport(container: HTMLElement): HTMLElement {
	const viewport = container.querySelector('[aria-roledescription="slide"]')
		?.parentElement?.parentElement;
	if (!(viewport instanceof HTMLElement)) throw new Error('viewport not found');
	return viewport;
}

describe('AutoHeight', () => {
	const originalMatchMedia = window.matchMedia;
	beforeEach(() => {
		roCallbacks = [];
	});
	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it('sizes the viewport to the first slide instantly on mount', () => {
		const {view} = renderCarousel();
		const viewport = getViewport(view.container);
		expect(viewport.style.height).toBe('100px');
		expect(viewport.style.transition).toBe('');
		/** The track must not stretch slides to the tallest — natural heights are the measure. */
		const track = viewport.firstElementChild;
		if (!(track instanceof HTMLElement)) throw new Error('track not found');
		expect(track.style.alignItems).toBe('flex-start');
	});

	it('animates the height change in step with a navigation', () => {
		const {handle, view} = renderCarousel();
		const viewport = getViewport(view.container);
		act(() => handle.current?.next());
		expect(viewport.style.height).toBe('150px');
		expect(viewport.style.transition).toContain('height 300ms');
	});

	it('measures the active real slide, not the prepended clone, in loop mode', () => {
		const {view} = renderCarousel({loop: true});
		const viewport = getViewport(view.container);
		/** The prepended clone copies the last slide (200px) — index 0 must measure 100px. */
		expect(viewport.style.height).toBe('100px');
	});

	it('re-measures when the active slide content resizes', () => {
		const {view} = renderCarousel();
		const viewport = getViewport(view.container);
		const slide = screen.getByRole('group', {name: '1 of 3'});
		slide.style.height = '260px';
		act(() => {
			for (const cb of roCallbacks) cb([], {} as ResizeObserver);
		});
		expect(viewport.style.height).toBe('260px');
	});

	it('applies heights instantly under prefers-reduced-motion', () => {
		window.matchMedia = ((query: string) => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
		})) as unknown as typeof window.matchMedia;
		const {handle, view} = renderCarousel();
		const viewport = getViewport(view.container);
		act(() => handle.current?.next());
		expect(viewport.style.height).toBe('150px');
		expect(viewport.style.transition).toBe('');
	});

	it('stays inert on a vertical carousel', () => {
		const {view} = renderCarousel({axis: 'y'});
		const viewport = getViewport(view.container);
		expect(viewport.style.height).toBe('');
	});

	it('clears the inline height when the plugin unmounts', () => {
		const {container, rerender} = render(
			<LightSlide label="Cards" autoHeight={<AutoHeight />}>
				{slides}
			</LightSlide>,
		);
		const viewport = getViewport(container);
		expect(viewport.style.height).toBe('100px');
		rerender(
			<LightSlide label="Cards" autoHeight={null}>
				{slides}
			</LightSlide>,
		);
		expect(viewport.style.height).toBe('');
		const track = viewport.firstElementChild;
		if (!(track instanceof HTMLElement)) throw new Error('track not found');
		expect(track.style.alignItems).toBe('');
	});

	it('fails loudly outside <LightSlide autoHeight={…}>', () => {
		/** React logs the render-phase throw — silence the expected noise. */
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		expect(() => render(<AutoHeight />)).toThrow(
			'lightslide/autoheight must be passed to <LightSlide autoHeight={…}>',
		);
		consoleError.mockRestore();
	});
});
