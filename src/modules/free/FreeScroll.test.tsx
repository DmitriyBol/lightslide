import {act, render, screen} from '@testing-library/react';

import {LightSlide} from '../../LightSlide/LightSlide';
import {Slide} from '../../Slide/Slide';
import {FreeScroll} from './FreeScroll';

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
	HTMLElement.prototype.setPointerCapture = jest.fn();
	HTMLElement.prototype.releasePointerCapture = jest.fn();
});

/**
 * jsdom has no PointerEvent, and testing-library's fallback Event constructor drops the
 * coordinate init — dispatch a plain bubbling Event with the pointer fields assigned, which
 * React's delegated pointer listeners read just fine.
 */
function firePointer(
	el: Element,
	type: 'pointerdown' | 'pointermove' | 'pointerup',
	props: {clientX: number; clientY: number; pointerId?: number},
) {
	const event = new Event(type, {bubbles: true, cancelable: true});
	Object.assign(event, props);
	act(() => {
		el.dispatchEvent(event);
	});
}

function renderCarousel(onIndexChange: (index: number) => void) {
	return render(
		<LightSlide
			label="Cards"
			free={<FreeScroll />}
			onIndexChange={onIndexChange}>
			<Slide>
				<div>One</div>
			</Slide>
			<Slide>
				<div>Two</div>
			</Slide>
			<Slide>
				<div>Three</div>
			</Slide>
		</LightSlide>,
	);
}

describe('FreeScroll', () => {
	it('replaces the drag-to-snap gesture through the seam', () => {
		const onIndexChange = jest.fn();
		renderCarousel(onIndexChange);

		/**
		 * jsdom measures slideWidth 0, so the whole strip is one 0-px "edge": a left drag
		 * overshoots and the free gesture snaps to maxIndex through the drag path. The
		 * built-in snap gesture would do nothing here (stride 0 → same index), so the
		 * navigation proves the plugin's handlers are the ones on the viewport.
		 */
		const slide = screen.getByText('One');
		firePointer(slide, 'pointerdown', {clientX: 500, clientY: 100, pointerId: 1});
		firePointer(slide, 'pointermove', {clientX: 400, clientY: 100});
		firePointer(slide, 'pointerup', {clientX: 400, clientY: 100});

		expect(onIndexChange).toHaveBeenCalledWith(2);
	});

	it('fails loudly outside <LightSlide free={…}>', () => {
		/** React logs the render-phase throw — silence the expected noise. */
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		expect(() => render(<FreeScroll />)).toThrow(
			'lightslide/free must be passed to <LightSlide free={…}>',
		);
		consoleError.mockRestore();
	});
});
