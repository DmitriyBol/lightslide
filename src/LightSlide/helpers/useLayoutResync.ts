import type {Dispatch, MutableRefObject, SetStateAction} from 'react';

import type {LightSlideStore} from './store';
import {useIsomorphicLayoutEffect} from './useIsomorphicLayoutEffect';

/** The layout-shape inputs plus the measure/snap machinery they drive. */
type LayoutResyncParams = {
	storeRef: MutableRefObject<LightSlideStore>;
	measureSlideWidth: () => void;
	snapTrack: (logicalIndex: number, animate: boolean) => void;
	onIndexChangeRef: MutableRefObject<((index: number) => void) | undefined>;
	setCurrentIndex: Dispatch<SetStateAction<number>>;
	slidesPerView: number;
	gap: number;
	centered: boolean;
	isLoop: boolean;
	flowEnabled: boolean;
	loading: boolean;
};

/**
 * Re-measures, re-clamps, and re-snaps (no animation) whenever the layout shape changes —
 * slidesPerView, gap, alignment, loop mode, flow, or loading clearing. A layout effect so loop mode positions
 * the track at its home offset before the first paint; otherwise the prepend clones would
 * flash for one frame and then jump to slide 0. A clamped-away position is reported to
 * onIndexChange (a real position change for synced consumer state), and the snap is skipped
 * while the flow runs — the flow owns the transform.
 */
export function useLayoutResync({
	storeRef,
	measureSlideWidth,
	snapTrack,
	onIndexChangeRef,
	setCurrentIndex,
	slidesPerView,
	gap,
	centered,
	isLoop,
	flowEnabled,
	loading,
}: LayoutResyncParams): void {
	useIsomorphicLayoutEffect(() => {
		measureSlideWidth();
		const s = storeRef.current;
		const newMax = Math.max(0, Math.ceil(s.slideCount - s.slidesPerView));
		s.maxIndex = newMax;
		const corrected = Math.min(s.currentIndex, newMax);
		if (corrected !== s.currentIndex) onIndexChangeRef.current?.(corrected);
		s.currentIndex = corrected;
		setCurrentIndex(corrected);
		if (!s.effectiveFlow) snapTrack(corrected, false);
	}, [
		slidesPerView,
		gap,
		centered,
		isLoop,
		flowEnabled,
		loading,
		storeRef,
		measureSlideWidth,
		snapTrack,
		onIndexChangeRef,
		setCurrentIndex,
	]);
}
