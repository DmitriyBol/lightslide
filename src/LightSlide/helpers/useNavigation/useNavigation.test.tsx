import {renderHook} from '@testing-library/react';

import type {LightSlideStore} from '../store';
import {createStore} from '../store';
import {useNavigation} from './useNavigation';

function setupNavigation(overrides: Partial<LightSlideStore> = {}) {
	const emitNav = jest.fn();
	const store = createStore({
		currentIndex: 1,
		maxIndex: 4,
		slideCount: 5,
		slideWidth: 300,
		emitNav,
		...overrides,
	});
	const storeRef = {current: store};
	const onIndexChange = jest.fn();
	const onIndexChangeRef = {current: onIndexChange};
	const setCurrentIndex = jest.fn();
	const snapToVisual = jest.fn();
	const {result} = renderHook(() =>
		useNavigation({
			storeRef,
			onIndexChangeRef,
			setCurrentIndex,
			snapToVisual,
		}),
	);
	return {
		navigate: result.current,
		store,
		emitNav,
		onIndexChange,
		setCurrentIndex,
		snapToVisual,
	};
}

describe('useNavigation — settle source', () => {
	afterEach(() => jest.clearAllMocks());

	it('commits state and reports through emitNav but never snaps the track', () => {
		const {
			navigate,
			store,
			emitNav,
			setCurrentIndex,
			onIndexChange,
			snapToVisual,
		} = setupNavigation({restOffset: 700, settleForward: true});
		navigate(2, 'settle');
		expect(store.currentIndex).toBe(2);
		expect(setCurrentIndex).toHaveBeenCalledWith(2);
		expect(onIndexChange).toHaveBeenCalledWith(2);
		expect(emitNav).toHaveBeenCalledWith(1, 2, 'right', 'settle');
		expect(snapToVisual).not.toHaveBeenCalled();
	});

	it('reports a forward loop coast (last → 0) as "right" from the recorded sign, not the index delta', () => {
		const {navigate, emitNav} = setupNavigation({
			isLoop: true,
			loopOffset: 1,
			slidesPerView: 1,
			maxIndex: 4,
			slideCount: 5,
			currentIndex: 4,
			settleForward: true,
		});
		navigate(0, 'settle');
		expect(emitNav).toHaveBeenCalledWith(4, 0, 'right', 'settle');
	});

	it('reports a backward loop coast (0 → last) as "left" — the index delta would invert it', () => {
		const {navigate, emitNav} = setupNavigation({
			isLoop: true,
			loopOffset: 1,
			slidesPerView: 1,
			maxIndex: 4,
			slideCount: 5,
			currentIndex: 0,
			settleForward: false,
		});
		navigate(4, 'settle');
		expect(emitNav).toHaveBeenCalledWith(0, 4, 'left', 'settle');
	});

	it('is silent when the coast rests on the index it started from', () => {
		const {navigate, emitNav, setCurrentIndex, snapToVisual} = setupNavigation({
			restOffset: 350,
		});
		navigate(1, 'settle');
		expect(emitNav).not.toHaveBeenCalled();
		expect(setCurrentIndex).not.toHaveBeenCalled();
		expect(snapToVisual).not.toHaveBeenCalled();
	});

	it('clamps in loop mode instead of triggering the wrap dance', () => {
		const {navigate, store, setCurrentIndex, snapToVisual} = setupNavigation({
			isLoop: true,
			loopOffset: 2,
			slidesPerView: 2,
			maxIndex: 3,
		});
		navigate(4, 'settle');
		expect(store.currentIndex).toBe(3);
		expect(setCurrentIndex).toHaveBeenCalledWith(3);
		expect(snapToVisual).not.toHaveBeenCalled();
	});
});

describe('useNavigation — loop wrap dance', () => {
	afterEach(() => jest.clearAllMocks());

	const loopStore = {
		isLoop: true,
		loopOffset: 1,
		slidesPerView: 1,
		maxIndex: 4,
		slideCount: 5,
	};

	it('next past the end animates onto the edge clone, then silently re-snaps to the real slide', () => {
		const {navigate, store, emitNav, snapToVisual} = setupNavigation({
			...loopStore,
			currentIndex: 4,
		});
		navigate(5, 'button');
		expect(store.currentIndex).toBe(0);
		expect(snapToVisual).toHaveBeenCalledTimes(1);
		expect(snapToVisual).toHaveBeenCalledWith(6, true, expect.any(Function));
		const [, , onComplete] = snapToVisual.mock.calls[0] as [
			number,
			boolean,
			() => void,
		];
		onComplete();
		expect(snapToVisual).toHaveBeenLastCalledWith(1, false);
		expect(emitNav).toHaveBeenCalledWith(4, 0, 'right', 'button');
	});

	it('prev from the first slide wraps with direction "left" — the true motion, not the index delta', () => {
		const {navigate, store, emitNav, snapToVisual} = setupNavigation({
			...loopStore,
			currentIndex: 0,
		});
		navigate(-1, 'button');
		expect(store.currentIndex).toBe(4);
		expect(snapToVisual).toHaveBeenCalledWith(0, true, expect.any(Function));
		const [, , onComplete] = snapToVisual.mock.calls[0] as [
			number,
			boolean,
			() => void,
		];
		onComplete();
		expect(snapToVisual).toHaveBeenLastCalledWith(5, false);
		expect(emitNav).toHaveBeenCalledWith(0, 4, 'left', 'button');
	});

	it('targets maxIndex’s pre-wrap twin, not visual 0, with a fractional slidesPerView', () => {
		/**
		 * count 5, spv 1.5 → maxIndex 4, loopOffset 2. The twin of visual maxIdx + offset = 6
		 * one content-width left is 6 − 5 = 1; animating to 0 instead would land a full
		 * stride short and jump at the silent re-snap.
		 */
		const {navigate, snapToVisual} = setupNavigation({
			isLoop: true,
			loopOffset: 2,
			slidesPerView: 1.5,
			maxIndex: 4,
			slideCount: 5,
			currentIndex: 0,
		});
		navigate(-1, 'button');
		expect(snapToVisual).toHaveBeenCalledWith(1, true, expect.any(Function));
		const [, , onComplete] = snapToVisual.mock.calls[0] as [
			number,
			boolean,
			() => void,
		];
		onComplete();
		expect(snapToVisual).toHaveBeenLastCalledWith(6, false);
	});
});

describe('useNavigation — emitNav mailbox', () => {
	afterEach(() => jest.clearAllMocks());

	it('hands flat arguments including the source to the assigned emitNav', () => {
		const {navigate, emitNav} = setupNavigation();
		navigate(2, 'button');
		expect(emitNav).toHaveBeenCalledTimes(1);
		expect(emitNav).toHaveBeenCalledWith(1, 2, 'right', 'button');
	});

	it('navigates fine with no emitNav assigned (analytics plugin absent)', () => {
		const {navigate, store, setCurrentIndex} = setupNavigation({
			emitNav: null,
		});
		navigate(2, 'drag');
		expect(store.currentIndex).toBe(2);
		expect(setCurrentIndex).toHaveBeenCalledWith(2);
	});
});

describe('useNavigation — rtl visual direction', () => {
	afterEach(() => jest.clearAllMocks());

	it('reports a forward step as "left" — the visual truth under rtl', () => {
		const {navigate, emitNav} = setupNavigation({dirSign: -1});
		navigate(2, 'button');
		expect(emitNav).toHaveBeenCalledWith(1, 2, 'left', 'button');
	});

	it('reports a forward wrap as "left" and a backward wrap as "right" under rtl', () => {
		const loop = {
			isLoop: true,
			loopOffset: 1,
			slidesPerView: 1,
			maxIndex: 4,
			slideCount: 5,
			dirSign: -1 as const,
		};
		const forward = setupNavigation({...loop, currentIndex: 4});
		forward.navigate(5, 'button');
		expect(forward.emitNav).toHaveBeenCalledWith(4, 0, 'left', 'button');

		const backward = setupNavigation({...loop, currentIndex: 0});
		backward.navigate(-1, 'button');
		expect(backward.emitNav).toHaveBeenCalledWith(0, 4, 'right', 'button');
	});
});

describe('useNavigation — vertical visual direction', () => {
	afterEach(() => jest.clearAllMocks());

	it('reports "down" forward and "up" backward on a vertical carousel', () => {
		const forward = setupNavigation({vertical: true});
		forward.navigate(2, 'button');
		expect(forward.emitNav).toHaveBeenCalledWith(1, 2, 'down', 'button');

		const backward = setupNavigation({vertical: true, currentIndex: 2});
		backward.navigate(1, 'button');
		expect(backward.emitNav).toHaveBeenCalledWith(2, 1, 'up', 'button');
	});

	it('reports a forward wrap as "down" — the motion, not the index delta', () => {
		const {navigate, emitNav} = setupNavigation({
			vertical: true,
			isLoop: true,
			loopOffset: 1,
			slidesPerView: 1,
			maxIndex: 4,
			slideCount: 5,
			currentIndex: 4,
		});
		navigate(5, 'button');
		expect(emitNav).toHaveBeenCalledWith(4, 0, 'down', 'button');
	});
});

describe('useNavigation — off-boundary re-align', () => {
	afterEach(() => jest.clearAllMocks());

	it('re-aligns the track when a user trigger targets the current index off-boundary', () => {
		/** Free-mode rest at 500 px; index 2's boundary is 600 px. */
		const {navigate, emitNav, snapToVisual} = setupNavigation({
			currentIndex: 2,
			restOffset: 500,
		});
		navigate(2, 'pagination');
		expect(snapToVisual).toHaveBeenCalledWith(2, true);
		expect(emitNav).not.toHaveBeenCalled();
	});

	it('stays put when the same trigger finds the track already on its boundary', () => {
		const {navigate, snapToVisual} = setupNavigation({
			currentIndex: 2,
			restOffset: 600,
		});
		navigate(2, 'pagination');
		expect(snapToVisual).not.toHaveBeenCalled();
	});

	it('keeps the unconditional snap-back for a same-index drag release', () => {
		const {navigate, snapToVisual} = setupNavigation({
			currentIndex: 2,
			restOffset: 600,
		});
		navigate(2, 'drag');
		expect(snapToVisual).toHaveBeenCalledWith(2, true);
	});
});
