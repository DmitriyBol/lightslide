import {render} from '@testing-library/react';

import type {A11yContextType} from '../a11ySeam';
import {A11yContext} from '../a11ySeam';
import {createStore} from '../LightSlide/helpers/store';
import {ReducedMotion} from './ReducedMotion';

import '@testing-library/jest-dom';

// Minimal controllable matchMedia: flip `matches` and fire the change listeners.
function installMatchMedia(initial: boolean) {
	let matches = initial;
	const listeners = new Set<() => void>();
	const mql = {
		get matches() {
			return matches;
		},
		media: '(prefers-reduced-motion: reduce)',
		addEventListener: (_type: string, l: () => void) => listeners.add(l),
		removeEventListener: (_type: string, l: () => void) => listeners.delete(l),
	};
	window.matchMedia = (() =>
		mql as unknown as MediaQueryList) as typeof window.matchMedia;
	return {
		change(next: boolean) {
			matches = next;
			listeners.forEach(l => l());
		},
	};
}

function mount(setMotionAllowed: jest.Mock) {
	const ctx: A11yContextType = {
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
		setMotionAllowed,
	};
	return render(
		<A11yContext.Provider value={ctx}>
			<ReducedMotion />
		</A11yContext.Provider>,
	);
}

describe('ReducedMotion', () => {
	const original = window.matchMedia;
	afterEach(() => {
		window.matchMedia = original;
	});

	it('closes the motion gate when reduced motion is preferred', () => {
		installMatchMedia(true);
		const setMotionAllowed = jest.fn();
		mount(setMotionAllowed);
		expect(setMotionAllowed).toHaveBeenLastCalledWith(false);
	});

	it('leaves the gate open when reduced motion is not preferred', () => {
		installMatchMedia(false);
		const setMotionAllowed = jest.fn();
		mount(setMotionAllowed);
		expect(setMotionAllowed).toHaveBeenLastCalledWith(true);
	});

	it('reacts live to the preference changing', () => {
		const mm = installMatchMedia(false);
		const setMotionAllowed = jest.fn();
		mount(setMotionAllowed);
		expect(setMotionAllowed).toHaveBeenLastCalledWith(true);
		mm.change(true);
		expect(setMotionAllowed).toHaveBeenLastCalledWith(false);
	});

	it('reopens the gate on unmount', () => {
		installMatchMedia(true);
		const setMotionAllowed = jest.fn();
		const {unmount} = mount(setMotionAllowed);
		setMotionAllowed.mockClear();
		unmount();
		expect(setMotionAllowed).toHaveBeenCalledWith(true);
	});

	it('is a no-op where matchMedia is unavailable', () => {
		// @ts-expect-error — deleting the optional global for this case
		delete window.matchMedia;
		const setMotionAllowed = jest.fn();
		mount(setMotionAllowed);
		expect(setMotionAllowed).not.toHaveBeenCalled();
	});
});
