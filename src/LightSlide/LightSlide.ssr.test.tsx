/**
 * @jest-environment node
 *
 * Server-rendering smoke: the whole public surface must renderToString in a plain Node
 * environment — no window/document at module scope (the style injector must stay guarded)
 * and no browser API touched during render. Verifies the SSR contract behind the README's
 * App Router claim: slide content is in the server HTML and the markup carries its critical
 * layout CSS so the pre-hydration paint already matches the final layout.
 */
import React from 'react';

import {renderToString} from 'react-dom/server';

import {Navigation} from '../modules/Navigation';
import {Pagination} from '../modules/Pagination';
import {Slide} from '../Slide/Slide';
import {LightSlide} from './LightSlide';

function carousel(extra?: {loop?: boolean; initialIndex?: number}) {
	return (
		<LightSlide
			label="Products"
			slidesPerView={2}
			gap={12}
			navigation={<Navigation />}
			pagination={<Pagination />}
			{...extra}>
			{['One', 'Two', 'Three', 'Four'].map(name => (
				<Slide key={name}>
					<div>{name}</div>
				</Slide>
			))}
		</LightSlide>
	);
}

describe('LightSlide SSR', () => {
	it('renders to string in a DOM-less environment with the content present', () => {
		const html = renderToString(carousel());

		expect(html).toContain('aria-roledescription="carousel"');
		expect(html).toContain('One');
		expect(html).toContain('Four');
		expect(html).toContain('aria-label="Previous slide"');
	});

	it('inlines the critical layout CSS for track, slides and controls', () => {
		const html = renderToString(carousel());

		expect(html).toContain('display:flex');
		expect(html).toContain('width:calc((100% - 12px)/2)');
		expect(html).toContain('position:absolute');
		expect(html).toContain('opacity:0');
	});

	it('pre-positions the loop track on its clone offset instead of the tail clones', () => {
		const html = renderToString(carousel({loop: true}));

		expect(html).toContain('*-2))');
	});

	/**
	 * The Navigation critical CSS legitimately contains static translateX/-Y placements, so
	 * the assertion targets the track's calc()-based rest transform specifically.
	 */
	it('keeps the non-loop track untransformed at index zero', () => {
		const html = renderToString(carousel());

		expect(html).not.toContain('translateX(calc');
	});
});
