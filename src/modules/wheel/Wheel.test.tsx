import {act, render, screen} from '@testing-library/react';

import {LightSlide} from '../../LightSlide/LightSlide';
import {Slide} from '../../Slide/Slide';
import {Wheel} from './Wheel';

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

function renderCarousel(onIndexChange: (index: number) => void) {
	return render(
		<LightSlide label="Cards" wheel={<Wheel />} onIndexChange={onIndexChange}>
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

describe('Wheel', () => {
	it('pages the carousel through the seam on a horizontal wheel gesture', () => {
		const onIndexChange = jest.fn();
		renderCarousel(onIndexChange);

		const container = screen.getByRole('region', {name: 'Cards'});
		act(() => {
			container.dispatchEvent(
				new WheelEvent('wheel', {cancelable: true, deltaX: 40}),
			);
		});

		expect(onIndexChange).toHaveBeenCalledWith(1);
	});

	it('ignores vertical scrolling over the carousel', () => {
		const onIndexChange = jest.fn();
		renderCarousel(onIndexChange);

		const container = screen.getByRole('region', {name: 'Cards'});
		act(() => {
			container.dispatchEvent(
				new WheelEvent('wheel', {cancelable: true, deltaY: 120}),
			);
		});

		expect(onIndexChange).not.toHaveBeenCalled();
	});

	it('is inert on a vertical carousel — the slot never binds its listener', () => {
		const onIndexChange = jest.fn();
		render(
			<LightSlide
				label="Cards"
				axis="y"
				wheel={<Wheel />}
				onIndexChange={onIndexChange}>
				<Slide>
					<div>One</div>
				</Slide>
				<Slide>
					<div>Two</div>
				</Slide>
			</LightSlide>,
		);

		const container = screen.getByRole('region', {name: 'Cards'});
		act(() => {
			container.dispatchEvent(
				new WheelEvent('wheel', {cancelable: true, deltaX: 40}),
			);
			container.dispatchEvent(
				new WheelEvent('wheel', {cancelable: true, deltaY: 120}),
			);
		});

		expect(onIndexChange).not.toHaveBeenCalled();
	});

	it('fails loudly outside <LightSlide wheel={…}>', () => {
		/** React logs the render-phase throw — silence the expected noise. */
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		expect(() => render(<Wheel />)).toThrow(
			'lightslide/wheel must be passed to <LightSlide wheel={…}>',
		);
		consoleError.mockRestore();
	});
});
