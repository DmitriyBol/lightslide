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

	it('drops a superseded snap’s pending onComplete so an interrupted wrap re-snap never fires late', () => {
		const {result, track} = setupTrackSnap();
		const staleComplete = jest.fn();
		result.current.snapToVisual(3, true, staleComplete);
		/** A second snap before the first transition ends supersedes it. */
		const nextComplete = jest.fn();
		result.current.snapToVisual(1, true, nextComplete);
		/** The one transition that completes belongs to the second snap only. */
		track.dispatchEvent(new Event('transitionend'));
		expect(staleComplete).not.toHaveBeenCalled();
		expect(nextComplete).toHaveBeenCalledTimes(1);
	});

	it('discards onComplete on transitioncancel and never defers it onto a later transition', () => {
		const {result, track} = setupTrackSnap();
		const onComplete = jest.fn();
		result.current.snapToVisual(3, true, onComplete);
		/**
		 * A drag clears the transition first (the gesture hooks' onStart), and moving the track
		 * then fires transitioncancel, not -end.
		 */
		track.style.transition = '';
		track.dispatchEvent(new Event('transitioncancel'));
		expect(onComplete).not.toHaveBeenCalled();
		/** A later, unrelated transition completing must not resurrect the discarded re-snap. */
		track.dispatchEvent(new Event('transitionend'));
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('ignores the cancel echo of the transition it replaced — a mid-wrap press still re-snaps', () => {
		const {result, track} = setupTrackSnap({isLoop: true, loopOffset: 1});
		const staleComplete = jest.fn();
		result.current.snapToVisual(0, true, staleComplete);
		const onComplete = jest.fn();
		result.current.snapToVisual(6, true, onComplete);
		/**
		 * The browser cancels the replaced transition a frame later — after this snap has
		 * subscribed, and while its own transition is still set.
		 */
		track.dispatchEvent(new Event('transitioncancel'));
		expect(track.style.transition).toContain('transform');
		track.dispatchEvent(new Event('transitionend'));
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(staleComplete).not.toHaveBeenCalled();
	});

	it('ignores transition events bubbling up from slide content', () => {
		const {result, track} = setupTrackSnap();
		const content = track.appendChild(document.createElement('div'));
		const onComplete = jest.fn();
		result.current.snapToVisual(1, true, onComplete);
		/** A hover transition on a card inside a slide ends mid-snap. */
		content.dispatchEvent(new Event('transitionend', {bubbles: true}));
		expect(onComplete).not.toHaveBeenCalled();
		expect(track.style.transition).toContain('transform');
		track.dispatchEvent(new Event('transitionend'));
		expect(onComplete).toHaveBeenCalledTimes(1);
	});
});
