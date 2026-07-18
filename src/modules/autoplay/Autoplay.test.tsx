import {act, render, screen} from '@testing-library/react';

import {LightSlide} from '../../LightSlide/LightSlide';
import {Slide} from '../../Slide/Slide';
import {Autoplay} from './Autoplay';

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
		<LightSlide
			label="Cards"
			autoplay={<Autoplay interval={1000} />}
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

describe('Autoplay', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('cycles slides on the interval through the seam', () => {
		const onIndexChange = jest.fn();
		renderCarousel(onIndexChange);

		act(() => jest.advanceTimersByTime(1000));
		expect(onIndexChange).toHaveBeenCalledWith(1);

		act(() => jest.advanceTimersByTime(1000));
		expect(onIndexChange).toHaveBeenCalledWith(2);
	});

	it('holds while the pointer hovers the carousel and resumes when it leaves', () => {
		const onIndexChange = jest.fn();
		renderCarousel(onIndexChange);

		const container = screen.getByRole('region', {name: 'Cards'});
		act(() => {
			container.dispatchEvent(new Event('pointerenter', {bubbles: false}));
		});
		act(() => jest.advanceTimersByTime(3000));
		expect(onIndexChange).not.toHaveBeenCalled();

		act(() => {
			container.dispatchEvent(new Event('pointerleave', {bubbles: false}));
		});
		act(() => jest.advanceTimersByTime(1000));
		expect(onIndexChange).toHaveBeenCalledWith(1);
	});

	it('fails loudly outside <LightSlide autoplay={…}>', () => {
		/** React logs the render-phase throw — silence the expected noise. */
		const consoleError = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		expect(() => render(<Autoplay interval={1000} />)).toThrow(
			'lightslide/autoplay must be passed to <LightSlide autoplay={…}>',
		);
		consoleError.mockRestore();
	});
});
