import React from 'react';

import {render, screen} from '@testing-library/react';

import {SlideMetricsContext} from '../seams/lightSlideContext';
import {Slide} from './Slide';

import '@testing-library/jest-dom';

function renderSlide(slideWidth: number, vertical: boolean) {
	render(
		<SlideMetricsContext.Provider value={{slideWidth, vertical}}>
			<Slide>
				<div>Content</div>
			</Slide>
		</SlideMetricsContext.Provider>,
	);
	const slide = screen.getByText('Content').parentElement;
	if (!slide) throw new Error('slide element missing');
	return slide;
}

describe('Slide', () => {
	it('applies the measured size as inline width on the horizontal axis', () => {
		const slide = renderSlide(320, false);
		expect(slide.style.width).toBe('320px');
		expect(slide.style.height).toBe('');
	});

	it('applies the measured size as inline height on the vertical axis', () => {
		const slide = renderSlide(320, true);
		expect(slide.style.height).toBe('320px');
		expect(slide.style.width).toBe('');
	});

	it('stays size-less before the client measures (the SSR calc owns the size)', () => {
		const slide = renderSlide(0, false);
		expect(slide.style.width).toBe('');
		expect(slide.style.height).toBe('');
	});
});
