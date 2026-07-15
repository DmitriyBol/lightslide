import {render, screen} from '@testing-library/react';

import type {A11yContextType} from '../a11ySeam';
import {A11yContext} from '../a11ySeam';
import {createStore} from '../LightSlide/helpers/store';
import {A11y} from './A11y';

import '@testing-library/jest-dom';

/**
 * Null refs + no matchMedia: Keyboard / FocusGuard / ReducedMotion all no-op, leaving the
 * LiveRegion as the one observable behaviour to assert the toggle against.
 */
function ctx(): A11yContextType {
	return {
		containerRef: {current: null},
		trackRef: {current: null},
		storeRef: {current: createStore()},
		currentIndex: 0,
		slideCount: 3,
		maxIndex: 2,
		slidesPerView: 1,
		isLoop: false,
		autoMotion: false,
		goToIndex: jest.fn(),
		setMotionAllowed: jest.fn(),
	};
}

function renderA11y(props: React.ComponentProps<typeof A11y> = {}) {
	return render(
		<A11yContext.Provider value={ctx()}>
			<A11y {...props} />
		</A11yContext.Provider>,
	);
}

describe('A11y', () => {
	it('renders the live region by default', () => {
		renderA11y();
		expect(screen.getByText('Slide 1 of 3')).toBeInTheDocument();
	});

	it('can turn the live region off', () => {
		renderA11y({liveRegion: false});
		expect(screen.queryByText(/Slide/)).not.toBeInTheDocument();
	});
});
