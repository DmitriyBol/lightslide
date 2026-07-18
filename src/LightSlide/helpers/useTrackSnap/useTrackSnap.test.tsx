import {renderHook} from '@testing-library/react';

import {prefersReducedMotion} from '../../../utils/reducedMotion/reducedMotion';
import type {LightSlideStore} from '../store';
import {createStore} from '../store';
import {useTrackSnap} from './useTrackSnap';

jest.mock('../../../utils/reducedMotion/reducedMotion');

function setupTrackSnap(overrides: Partial<LightSlideStore> = {}) {
	const track = document.createElement('div');
	const store = createStore({
		currentIndex: 0,
		maxIndex: 4,
		slideCount: 5,
		slidesPerView: 1,
		slideWidth: 300,
		gap: 0,
		...overrides,
	});
	const storeRef = {current: store};
	const {result} = renderHook(() => useTrackSnap({current: track}, storeRef));
	return {result, track, store};
}

describe('useTrackSnap', () => {
	afterEach(() => jest.clearAllMocks());

	it('moves the track to the visual boundary and records it as the new rest position', () => {
		const {result, track, store} = setupTrackSnap();
		result.current.snapToVisual(2, false);
		expect(track.style.transform).toBe('translateX(-600px)');
		expect(store.restOffset).toBe(600);
	});

	it('animates via a CSS transition and fires onComplete on transitionend', () => {
		const {result, track} = setupTrackSnap();
		const onComplete = jest.fn();
		result.current.snapToVisual(1, true, onComplete);
		expect(track.style.transition).toContain('transform');
		expect(track.style.transform).toBe('translateX(-300px)');
		expect(onComplete).not.toHaveBeenCalled();
		track.dispatchEvent(new Event('transitionend'));
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(track.style.transition).toBe('');
	});

	it('fires onComplete synchronously when animate is false', () => {
		const {result, track} = setupTrackSnap();
		const onComplete = jest.fn();
		result.current.snapToVisual(1, false, onComplete);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(track.style.transition).toBe('');
	});

	it('still fires onComplete under reduced motion — the loop re-snap depends on it', () => {
		/** Once: clearAllMocks clears calls but not return values set for later tests. */
		jest.mocked(prefersReducedMotion).mockReturnValueOnce(true);
		const {result, track, store} = setupTrackSnap();
		const onComplete = jest.fn();
		result.current.snapToVisual(1, true, onComplete);
		/**
		 * The instant branch must run: a forced CSS transition would never emit transitionend
		 * and the wrap dance's silent re-snap would stall forever.
		 */
		expect(track.style.transition).toBe('');
		expect(track.style.transform).toBe('translateX(-300px)');
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(store.restOffset).toBe(300);
	});

	it('snapTrack converts a logical index to visual by adding the loop offset', () => {
		const {result, track} = setupTrackSnap({isLoop: true, loopOffset: 2});
		result.current.snapTrack(1, false);
		expect(track.style.transform).toBe('translateX(-900px)');
	});

	it('snapTrack leaves the index untouched outside loop mode', () => {
		const {result, track} = setupTrackSnap();
		result.current.snapTrack(1, false);
		expect(track.style.transform).toBe('translateX(-300px)');
	});

	it('mirrors the transform sign under rtl, rest offset unchanged', () => {
		const {result, track, store} = setupTrackSnap({dirSign: -1});
		result.current.snapToVisual(2, false);
		expect(track.style.transform).toBe('translateX(600px)');
		expect(store.restOffset).toBe(600);
	});
});
