import {createRef} from 'react';

import {act, render} from '@testing-library/react';

import {LightSlide} from '../../LightSlide/LightSlide';
import {Slide} from '../../Slide/Slide';
import type {LightSlideHandle} from '../../types';
import {Fade} from './Fade';

import '@testing-library/jest-dom';

/**
 * Fade wiring, end to end in jsdom: seam registration → injected stack stylesheet →
 * per-slide visibility flips on navigation. The crossfade itself is CSS (unreachable
 * here); what jsdom can prove is the contract the CSS rides on — the scoped rules, and the
 * inline opacity / z-index / pointer-events / aria-hidden / inert the effect stamps on the
 * real slides.
 */

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeAll(() => {
	Object.defineProperty(global, 'ResizeObserver', {
		writable: true,
		value: MockResizeObserver,
	});
});

const slides = [
	<Slide key="one">
		<div>One</div>
	</Slide>,
	<Slide key="two">
		<div>Two</div>
	</Slide>,
	<Slide key="three">
		<div>Three</div>
	</Slide>,
];

function renderCarousel(props: {loop?: boolean} = {}) {
	const handle = createRef<LightSlideHandle>();
	const view = render(
		<LightSlide label="Cards" fade={<Fade />} ref={handle} {...props}>
			{slides}
		</LightSlide>,
	);
	return {handle, view};
}

/** The fade entry's injected stylesheet — the second <style> after the core's SSR CSS. */
function getFadeCss(container: HTMLElement): string {
	const styles = [...container.querySelectorAll('style')];
	const fade = styles.find(s => s.textContent?.includes('grid-area'));
	if (!fade) throw new Error('fade stylesheet not found');
	return fade.textContent ?? '';
}

/**
 * aria-hidden erases a slide's computed accessible name — hiding slides is the plugin's
 * job — so role+name queries can't reach them; select by the aria-label attribute instead.
 */
function getSlide(name: string): HTMLElement {
	const slide = document.querySelector(
		`[aria-roledescription="slide"][aria-label="${name}"]`,
	);
	if (!(slide instanceof HTMLElement)) {
		throw new Error(`slide ${name} not found`);
	}
	return slide;
}

describe('Fade', () => {
	it('serves the stack stylesheet scoped to this instance', () => {
		const {view} = renderCarousel();
		const css = getFadeCss(view.container);
		const track = getSlide('1 of 3').parentElement;
		if (!(track instanceof HTMLElement)) throw new Error('track not found');
		expect(css).toContain(`[id="${track.id}"]`);
		expect(css).toContain('display:grid');
		expect(css).toContain('transform:none!important');
		expect(css).toContain('grid-area:1/1');
		expect(css).toContain('transition:opacity 300ms');
		expect(css).toContain('prefers-reduced-motion');
	});

	it('shows only the active slide; the rest are hidden for every audience', () => {
		renderCarousel();
		const active = getSlide('1 of 3');
		expect(active.style.opacity).toBe('1');
		expect(active.style.zIndex).toBe('1');
		expect(active).not.toHaveAttribute('aria-hidden');
		expect(active).not.toHaveAttribute('inert');
		for (const name of ['2 of 3', '3 of 3']) {
			const hidden = getSlide(name);
			expect(hidden.style.opacity).toBe('0');
			expect(hidden.style.pointerEvents).toBe('none');
			expect(hidden).toHaveAttribute('aria-hidden', 'true');
			expect(hidden).toHaveAttribute('inert');
		}
	});

	it('flips visibility to the new active slide on navigation', () => {
		const {handle} = renderCarousel();
		act(() => handle.current?.next());
		const active = getSlide('2 of 3');
		expect(active.style.opacity).toBe('1');
		expect(active).not.toHaveAttribute('aria-hidden');
		const previous = getSlide('1 of 3');
		expect(previous.style.opacity).toBe('0');
		expect(previous).toHaveAttribute('aria-hidden', 'true');
	});

	it('targets the real slide in loop mode and leaves the clones to the core', () => {
		const {view} = renderCarousel({loop: true});
		const active = getSlide('1 of 3');
		expect(active.style.opacity).toBe('1');
		expect(active).not.toHaveAttribute('aria-hidden');
		const track = active.parentElement;
		if (!(track instanceof HTMLElement)) throw new Error('track not found');
		const clone = track.children[0];
		if (!(clone instanceof HTMLElement)) throw new Error('clone not found');
		expect(clone).not.toBe(active);
		expect(clone).toHaveAttribute('aria-hidden', 'true');
		expect(clone.style.opacity).toBe('');
		/** The frozen initial-visibility rule points at the active real child, not a clone. */
		const nth = [...track.children].indexOf(active) + 1;
		expect(getFadeCss(view.container)).toContain(`:nth-child(${nth})`);
	});

	it('renders no stylesheet while inactive (loading)', () => {
		const {container} = render(
			<LightSlide label="Cards" fade={<Fade />} loading fallback={<p>…</p>}>
				{slides}
			</LightSlide>,
		);
		const styles = [...container.querySelectorAll('style')];
		expect(styles.some(s => s.textContent?.includes('grid-area'))).toBe(false);
	});

	it('restores the slides when the plugin unmounts', () => {
		const {rerender} = render(
			<LightSlide label="Cards" fade={<Fade />}>
				{slides}
			</LightSlide>,
		);
		expect(getSlide('2 of 3').style.opacity).toBe('0');
		rerender(
			<LightSlide label="Cards" fade={null}>
				{slides}
			</LightSlide>,
		);
		for (const name of ['1 of 3', '2 of 3', '3 of 3']) {
			const slide = getSlide(name);
			expect(slide.style.opacity).toBe('');
			expect(slide.style.pointerEvents).toBe('');
			expect(slide).not.toHaveAttribute('aria-hidden');
			expect(slide).not.toHaveAttribute('inert');
		}
	});

	it('warns once when slidesPerView is not 1', () => {
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		renderCarousel();
		expect(consoleError).not.toHaveBeenCalled();
		render(
			<LightSlide label="Wide" slidesPerView={2} fade={<Fade />}>
				{slides}
			</LightSlide>,
		);
		expect(consoleError).toHaveBeenCalledWith(
			expect.stringContaining('lightslide/fade expects slidesPerView 1'),
		);
		consoleError.mockRestore();
	});

	it('fails loudly outside <LightSlide fade={…}>', () => {
		/** React logs the render-phase throw — silence the expected noise. */
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		expect(() => render(<Fade />)).toThrow(
			'lightslide/fade must be passed to <LightSlide fade={…}>',
		);
		consoleError.mockRestore();
	});
});
