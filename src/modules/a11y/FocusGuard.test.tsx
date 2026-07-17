import {render} from '@testing-library/react';

import type {A11yContextType} from '../../a11ySeam';
import {A11yContext} from '../../a11ySeam';
import {createStore} from '../../LightSlide/helpers/store';
import {FocusGuard} from './FocusGuard';

import '@testing-library/jest-dom';

/**
 * Builds a track element with `total` child slides and returns it detached — FocusGuard reads
 * track.children directly, so it doesn't need to be in the document.
 */
function makeTrack(total: number) {
	const track = document.createElement('div');
	for (let i = 0; i < total; i++) track.appendChild(document.createElement('div'));
	return track;
}

function mount(track: HTMLDivElement, overrides?: Partial<A11yContextType>) {
	const ctx: A11yContextType = {
		containerRef: {current: null},
		trackRef: {current: track},
		storeRef: {current: createStore()},
		currentIndex: 0,
		slideCount: 3,
		maxIndex: 2,
		slidesPerView: 1,
		isLoop: false,
		isFlow: false,
		autoMotion: false,
		goToIndex: jest.fn(),
		setMotionAllowed: jest.fn(),
		...overrides,
	};
	return render(
		<A11yContext.Provider value={ctx}>
			<FocusGuard />
		</A11yContext.Provider>,
	);
}

const inert = (track: HTMLElement, i: number) =>
	track.children[i].hasAttribute('inert');

describe('FocusGuard', () => {
	it('makes off-screen slides inert and keeps the visible one interactive', () => {
		const track = makeTrack(3);
		mount(track, {currentIndex: 1, slideCount: 3, slidesPerView: 1});
		expect(inert(track, 0)).toBe(true);
		expect(inert(track, 1)).toBe(false);
		expect(inert(track, 2)).toBe(true);
	});

	it('keeps ⌈slidesPerView⌉ slides interactive (incl. a fractional peek)', () => {
		const track = makeTrack(4);
		mount(track, {currentIndex: 0, slideCount: 4, slidesPerView: 1.5});
		/** window is [0, ceil(1.5)-1] = [0,1] */
		expect(inert(track, 0)).toBe(false);
		expect(inert(track, 1)).toBe(false);
		expect(inert(track, 2)).toBe(true);
		expect(inert(track, 3)).toBe(true);
	});

	it('offsets by the loop clones and never un-inerts a clone', () => {
		/** loop layout at slidesPerView 1: [clonePre, real0, real1, real2, clonePost] */
		const track = makeTrack(5);
		/** pre-mark the clones inert as the core would */
		track.children[0].setAttribute('inert', '');
		track.children[4].setAttribute('inert', '');
		mount(track, {
			currentIndex: 0,
			slideCount: 3,
			slidesPerView: 1,
			isLoop: true,
			storeRef: {current: createStore({loopOffset: 1})},
		});
		expect(inert(track, 0)).toBe(true); /** clone stays inert */
		expect(inert(track, 1)).toBe(false); /** real0 visible */
		expect(inert(track, 2)).toBe(true); /** real1 off-screen */
		expect(inert(track, 3)).toBe(true); /** real2 off-screen */
		expect(inert(track, 4)).toBe(true); /** clone stays inert */
	});

	it('suspends during flow: every real slide stays interactive, clones stay inert', () => {
		/** flow layout at slidesPerView 1: [clonePre, real0..real2, clonePost], drifting */
		const track = makeTrack(5);
		track.children[0].setAttribute('inert', '');
		track.children[4].setAttribute('inert', '');
		mount(track, {
			currentIndex: 0,
			slideCount: 3,
			slidesPerView: 1,
			isLoop: true,
			isFlow: true,
			autoMotion: true,
			storeRef: {current: createStore({loopOffset: 1})},
		});
		expect(inert(track, 0)).toBe(true);
		expect(inert(track, 1)).toBe(false);
		expect(inert(track, 2)).toBe(false);
		expect(inert(track, 3)).toBe(false);
		expect(inert(track, 4)).toBe(true);
	});

	it('keeps the left peek interactive in center mode', () => {
		/** centered at index 1, spv 1.5 → window [0, 2]: the centring inset exposes slide 0 */
		const track = makeTrack(4);
		mount(track, {
			currentIndex: 1,
			slideCount: 4,
			slidesPerView: 1.5,
			storeRef: {current: createStore({centerInset: 100})},
		});
		expect(inert(track, 0)).toBe(false);
		expect(inert(track, 1)).toBe(false);
		expect(inert(track, 2)).toBe(false);
		expect(inert(track, 3)).toBe(true);
	});

	it('clears the guards it set on unmount', () => {
		const track = makeTrack(3);
		const {unmount} = mount(track, {currentIndex: 0, slideCount: 3});
		expect(inert(track, 1)).toBe(true);
		unmount();
		expect(inert(track, 1)).toBe(false);
		expect(inert(track, 2)).toBe(false);
	});
});
