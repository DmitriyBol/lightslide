import {fireEvent, render} from '@testing-library/react';

import type {A11yContextType} from '../a11ySeam';
import {A11yContext} from '../a11ySeam';
import {createStore} from '../LightSlide/helpers/store';
import {Keyboard} from './Keyboard';

import '@testing-library/jest-dom';

// A real, attached container so the keydown listener (bound to containerRef.current) receives events.
function setup(overrides?: Partial<A11yContextType>) {
	const container = document.createElement('div');
	document.body.appendChild(container);
	const goToIndex = jest.fn();
	const ctx: A11yContextType = {
		containerRef: {current: container},
		trackRef: {current: null},
		storeRef: {current: createStore()},
		currentIndex: 2,
		slideCount: 6,
		maxIndex: 5,
		slidesPerView: 1,
		isLoop: false,
		autoMotion: false,
		goToIndex,
		setMotionAllowed: jest.fn(),
		...overrides,
	};
	render(
		<A11yContext.Provider value={ctx}>
			<Keyboard />
		</A11yContext.Provider>,
	);
	return {container, goToIndex};
}

describe('Keyboard', () => {
	it('ArrowRight / ArrowLeft step one slide', () => {
		const {container, goToIndex} = setup({currentIndex: 2});
		fireEvent.keyDown(container, {key: 'ArrowRight'});
		expect(goToIndex).toHaveBeenCalledWith(3, 'button');
		fireEvent.keyDown(container, {key: 'ArrowLeft'});
		expect(goToIndex).toHaveBeenCalledWith(1, 'button');
	});

	it('Home / End jump to the first and last positions', () => {
		const {container, goToIndex} = setup({currentIndex: 2, maxIndex: 5});
		fireEvent.keyDown(container, {key: 'Home'});
		expect(goToIndex).toHaveBeenCalledWith(0, 'button');
		fireEvent.keyDown(container, {key: 'End'});
		expect(goToIndex).toHaveBeenCalledWith(5, 'button');
	});

	it('ignores other keys', () => {
		const {container, goToIndex} = setup();
		fireEvent.keyDown(container, {key: 'a'});
		fireEvent.keyDown(container, {key: 'Enter'});
		expect(goToIndex).not.toHaveBeenCalled();
	});

	it('does not hijack arrow keys inside a form field', () => {
		const {container, goToIndex} = setup();
		const input = document.createElement('input');
		container.appendChild(input);
		fireEvent.keyDown(input, {key: 'ArrowRight'});
		expect(goToIndex).not.toHaveBeenCalled();
	});
});
