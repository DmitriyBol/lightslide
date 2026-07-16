import React from 'react';

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {NavContextType} from '../../lightSlideContext';
import {NavContext} from '../../lightSlideContext';
import {Pagination} from './Pagination';

import '@testing-library/jest-dom';

function makeContext(overrides?: Partial<NavContextType>): NavContextType {
	return {
		currentIndex: 0,
		maxIndex: 4,
		isLoop: false,
		isReady: true,
		slidesId: 'slides-test',
		goToIndex: jest.fn(),
		...overrides,
	};
}

function renderPagination(
	ctx: NavContextType,
	props: React.ComponentProps<typeof Pagination> = {},
) {
	return render(
		<NavContext.Provider value={ctx}>
			<Pagination {...props} />
		</NavContext.Provider>,
	);
}

describe('Pagination', () => {
	it('renders maxIndex + 1 dots', () => {
		renderPagination(makeContext({maxIndex: 4}));
		/** 5 dots for maxIndex=4 */
		expect(screen.getAllByRole('button')).toHaveLength(5);
	});

	it('marks the current dot as active via aria-current', () => {
		renderPagination(makeContext({currentIndex: 2, maxIndex: 4}));
		const buttons = screen.getAllByRole('button');
		expect(buttons[2]).toHaveAttribute('aria-current', 'true');
		expect(buttons[0]).not.toHaveAttribute('aria-current');
		expect(buttons[4]).not.toHaveAttribute('aria-current');
	});

	it("calls goToIndex with (dotIndex, 'pagination') on dot click", async () => {
		const goToIndex = jest.fn();
		renderPagination(makeContext({currentIndex: 0, maxIndex: 3, goToIndex}));
		await userEvent.click(screen.getByLabelText('Go to slide 3'));
		expect(goToIndex).toHaveBeenCalledWith(2, 'pagination');
	});

	it('calls goToIndex with the correct index for each dot', async () => {
		const goToIndex = jest.fn();
		renderPagination(makeContext({maxIndex: 2, goToIndex}));
		const buttons = screen.getAllByRole('button');
		await userEvent.click(buttons[1]);
		expect(goToIndex).toHaveBeenCalledWith(1, 'pagination');
	});

	it('renders 1 dot when maxIndex is 0', () => {
		renderPagination(makeContext({maxIndex: 0}));
		expect(screen.getAllByRole('button')).toHaveLength(1);
	});
});
