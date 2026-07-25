import React from 'react';

import {act, render, screen} from '@testing-library/react';

import {A11y} from '../modules/a11y';
import {Navigation} from '../modules/Navigation';
import {Pagination} from '../modules/Pagination';
import {Slide} from '../Slide/Slide';
import {LightSlide} from './LightSlide';

import '@testing-library/jest-dom';

/**
 * Variable-width (`slidesPerView: 'auto'`) wiring, end to end in jsdom: measurement →
 * store.slideOffsets → measured maxIndex → the dot count. jsdom reports every offsetWidth as
 * 0, so the prototype getter below resolves an element's inline `width` (the demo pattern of
 * naturally-sized slides) and the viewport's own width from a data attribute.
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
	Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
		configurable: true,
		get(this: HTMLElement) {
			const own = Number.parseFloat(this.style.width);
			if (Number.isFinite(own)) return own;
			/** A slide with no width of its own is as wide as its (sized) content. */
			const child = this.firstElementChild;
			if (child instanceof HTMLElement) {
				const inner = Number.parseFloat(child.style.width);
				if (Number.isFinite(inner)) return inner;
			}
			/** The viewport and stage are as wide as the sized container above them. */
			let node = this.parentElement;
			while (node) {
				const up = Number.parseFloat(node.style.width);
				if (Number.isFinite(up)) return up;
				node = node.parentElement;
			}
			return 0;
		},
	});
});

const SIZES = [120, 210, 90, 250, 110, 150, 170];

function renderAuto(viewportWidth: number) {
	const view = render(
		<LightSlide
			slidesPerView="auto"
			gap={12}
			style={{width: viewportWidth}}
			pagination={<Pagination />}>
			{SIZES.map((w, i) => (
				<Slide key={i}>
					<div style={{width: w}}>slide {i}</div>
				</Slide>
			))}
		</LightSlide>,
	);
	return view;
}

describe('LightSlide — variable width', () => {
	it('measures each slide and collapses trailing positions that share the last viewport', () => {
		/**
		 * Cumulative edges [0,132,354,456,718,840,1002,1184] → content 1172. With a 564px
		 * viewport the max offset is 608, and the first slide whose edge reaches it is index 4:
		 * the last three slides share that final flush position, so there are 5 dots, not 7.
		 */
		renderAuto(564);
		const dots = screen.getAllByRole('button', {name: /go to slide/i});
		expect(dots).toHaveLength(5);
	});

	it('recovers when the first measurement happens at zero size (mounted hidden)', () => {
		/**
		 * A carousel mounted inside a collapsed/hidden container measures every size as 0, which
		 * would otherwise freeze a nonsense position count. Once the real sizes arrive through
		 * the ResizeObserver the strip must re-measure to the true 5 positions.
		 */
		roCallbacks = [];
		const {container} = render(
			<LightSlide slidesPerView="auto" gap={12} pagination={<Pagination />}>
				{SIZES.map((w, i) => (
					<Slide key={i}>
						<div data-size={w}>slide {i}</div>
					</Slide>
				))}
			</LightSlide>,
		);
		expect(screen.getAllByRole('button', {name: /go to slide/i})).toHaveLength(7);

		/** The container is laid out: give it and the slide contents their real widths. */
		const root = container.firstElementChild;
		if (root instanceof HTMLElement) root.style.width = '564px';
		for (const node of container.querySelectorAll('[data-size]')) {
			if (node instanceof HTMLElement)
				node.style.width = `${node.getAttribute('data-size')}px`;
		}
		act(() => {
			for (const cb of roCallbacks) cb([], {} as ResizeObserver);
		});

		expect(screen.getAllByRole('button', {name: /go to slide/i})).toHaveLength(5);
	});

	describe('loop', () => {
		function renderAutoLoop() {
			return render(
				<LightSlide
					slidesPerView="auto"
					gap={12}
					loop
					style={{width: 564}}
					navigation={<Navigation />}>
					{SIZES.map((w, i) => (
						<Slide key={i}>
							<div style={{width: w}}>slide {i}</div>
						</Slide>
					))}
				</LightSlide>,
			);
		}

		it('duplicates the whole strip on each side so any viewport is covered', () => {
			const {container} = renderAutoLoop();
			const track = container.querySelector('[aria-roledescription="slide"]')
				?.parentElement;
			/** 7 real slides + 7 prepended + 7 appended. */
			expect(track?.children).toHaveLength(SIZES.length * 3);
			const hidden = container.querySelectorAll('[aria-hidden="true"]');
			expect(hidden).toHaveLength(SIZES.length * 2);
		});

		it('measures offsets across the whole strip, clones included', () => {
			const {container} = renderAutoLoop();
			const track = container.querySelector('[aria-roledescription="slide"]')
				?.parentElement;
			/** The transform rests on the first real slide — one full strip in. */
			const contentWidth =
				SIZES.reduce((a, b) => a + b, 0) + SIZES.length * 12;
			expect(track).toHaveStyle(`transform: translateX(-${contentWidth}px)`);
		});

		it('wraps backward from the first slide onto the preceding clone', () => {
			renderAutoLoop();
			const prev = screen.getByRole('button', {name: /previous/i});
			expect(prev).toBeEnabled();
			act(() => {
				prev.click();
			});
			/** maxIndex is measured (4), so a backward wrap lands there, not on slide 6. */
			expect(
				screen.getByRole('group', {name: /5 of 7/i}),
			).toBeInTheDocument();
		});
	});

	it('keeps every on-screen slide interactive under the focus guard', () => {
		/**
		 * slidesPerView is 1 in auto, so a derived window would mark all but the active slide
		 * inert — and inert also swallows clicks, hiding slides in plain view. The measured
		 * count keeps the four that share the viewport (120+210+90 fit, 250 peeks) interactive.
		 */
		render(
			<LightSlide
				slidesPerView="auto"
				gap={12}
				style={{width: 564}}
				a11y={<A11y />}>
				{SIZES.map((w, i) => (
					<Slide key={i}>
						<div style={{width: w}}>slide {i}</div>
					</Slide>
				))}
			</LightSlide>,
		);

		const slides = screen.getAllByRole('group', {name: /of 7/});
		const interactive = slides.filter(s => !s.hasAttribute('inert'));
		expect(interactive).toHaveLength(4);
	});

	it('applies no inline width to the slides — each keeps its content size', () => {
		const {container} = renderAuto(564);
		const slides = container.querySelectorAll('[aria-roledescription="slide"]');
		for (const slide of slides) {
			if (slide instanceof HTMLElement) expect(slide.style.width).toBe('');
		}
	});
});
