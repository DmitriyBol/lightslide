import React from 'react';

import {act} from '@testing-library/react';
import {TextEncoder} from 'node:util';
import {hydrateRoot} from 'react-dom/client';

import {Navigation} from '../modules/Navigation';
import {Pagination} from '../modules/Pagination';
import {Slide} from '../Slide/Slide';
import {LightSlide} from './LightSlide';

/**
 * jsdom ships no TextEncoder, which react-dom/server.browser requires at module load —
 * polyfill first and import the server renderer lazily inside the test.
 */
Object.defineProperty(global, 'TextEncoder', {
	writable: true,
	value: TextEncoder,
});

/** ── IntersectionObserver mock ────────────────────────────────────────────── */
class MockIntersectionObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

/** ── ResizeObserver mock ──────────────────────────────────────────────────── */
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

/**
 * Hydration must adopt the server markup byte-for-byte: React reports any divergence
 * through console.error / onRecoverableError, so a clean run here is the regression guard
 * for the App Router zero-CLS story (a mismatch would re-render client-side and shift).
 */
describe('LightSlide hydration', () => {
	it('hydrates server markup without mismatches', async () => {
		const ui = (
			<LightSlide
				label="Products"
				slidesPerView={2}
				gap={12}
				loop
				navigation={<Navigation />}
				pagination={<Pagination />}>
				{['One', 'Two', 'Three'].map(name => (
					<Slide key={name}>
						<div>{name}</div>
					</Slide>
				))}
			</LightSlide>
		);

		const {renderToString} = await import('react-dom/server');
		const container = document.createElement('div');
		container.innerHTML = renderToString(ui);
		document.body.appendChild(container);

		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
		const onRecoverableError = jest.fn();

		await act(async () => {
			hydrateRoot(container, ui, {onRecoverableError});
		});

		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(consoleError).not.toHaveBeenCalled();

		consoleError.mockRestore();
		document.body.removeChild(container);
	});
});
