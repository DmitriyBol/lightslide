import {render, screen} from '@testing-library/react';

import type {A11yContextType} from '../a11ySeam';
import {A11yContext} from '../a11ySeam';
import {createStore} from '../LightSlide/helpers/store';
import {LiveRegion} from './LiveRegion';

import '@testing-library/jest-dom';

function makeContext(overrides?: Partial<A11yContextType>): A11yContextType {
	return {
		containerRef: {current: null},
		trackRef: {current: null},
		storeRef: {current: createStore()},
		currentIndex: 0,
		slideCount: 4,
		maxIndex: 3,
		slidesPerView: 1,
		isLoop: false,
		autoMotion: false,
		goToIndex: jest.fn(),
		setMotionAllowed: jest.fn(),
		...overrides,
	};
}

function renderLive(
	ctx: A11yContextType,
	props: React.ComponentProps<typeof LiveRegion> = {},
) {
	return render(
		<A11yContext.Provider value={ctx}>
			<LiveRegion {...props} />
		</A11yContext.Provider>,
	);
}

describe('LiveRegion', () => {
	it('announces the active slide as "Slide N of M"', () => {
		renderLive(makeContext({currentIndex: 2, slideCount: 4}));
		expect(screen.getByText('Slide 3 of 4')).toBeInTheDocument();
	});

	it('is polite while idle', () => {
		renderLive(makeContext({autoMotion: false}));
		expect(screen.getByText(/Slide/)).toHaveAttribute('aria-live', 'polite');
	});

	it('goes quiet (aria-live off) while auto-motion runs', () => {
		renderLive(makeContext({autoMotion: true}));
		expect(screen.getByText(/Slide/)).toHaveAttribute('aria-live', 'off');
	});

	it('honours a custom announce formatter', () => {
		renderLive(makeContext({currentIndex: 1, slideCount: 5}), {
			announce: (i, n) => `${i + 1}/${n}`,
		});
		expect(screen.getByText('2/5')).toBeInTheDocument();
	});

	it('throws a clear error when used outside <LightSlide a11y>', () => {
		/** Silence the expected React error boundary logging for this assertion. */
		const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(<LiveRegion />)).toThrow(/a11y/);
		spy.mockRestore();
	});
});
