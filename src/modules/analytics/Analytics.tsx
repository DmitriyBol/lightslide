import {useCallback, useEffect, useMemo} from 'react';

import {useLatestRef} from '../../LightSlide/helpers/useLatestRef/useLatestRef';
import {useAnalyticsSeam} from '../../seams/analyticsSeam';
import type {AnalyticsProps} from './Analytics.types';
import {collectSlideData} from './slideData';
import {useViewedSlides} from './useViewedSlides';
import {useViewportEngagement} from './useViewportEngagement';

/**
 * Opt-in typed analytics — pass `analytics={<Analytics onEvent={…} />}`. Renders nothing:
 * it assigns the store's `emitNav` mailbox through the seam (the core reports every committed
 * navigation with flat arguments and this plugin builds the event objects), observes the
 * container for the in-viewport/terminal lifecycle, and tracks viewed slides. Bundles that
 * never import `lightslide/analytics` pay nothing for any of it.
 *
 * A loop wrap is recognised from the arguments alone — the direction contradicts the index
 * delta (`right` with `to <= from`, `left` with `to >= from`) — and never counts as reaching
 * the end, mirroring the pre-plugin core behaviour.
 */
export function Analytics<T = unknown>({
	onEvent,
	viewedTimeout,
}: AnalyticsProps<T>) {
	const {containerRef, storeRef, slides} = useAnalyticsSeam();

	const onEventRef = useLatestRef(onEvent);

	const slideData = useMemo(() => collectSlideData<T>(slides), [slides]);
	const slideDataRef = useLatestRef(slideData);
	const getSlideData = useCallback(
		(index: number) => slideDataRef.current[index],
		[slideDataRef],
	);

	const {markViewed, getViewedSlides} = useViewedSlides<T>(getSlideData);

	const {fireTerminalIfNeeded} = useViewportEngagement<T>({
		containerRef,
		storeRef,
		onEventRef,
		viewedTimeout,
		markViewed,
		getViewedSlides,
		getSlideData,
	});

	useEffect(() => {
		const store = storeRef.current;
		store.emitNav = (from, to, direction, source) => {
			markViewed(to);
			const emit = onEventRef.current;
			emit({event: 'carousel_slide', direction, fromIndex: from, toIndex: to});
			if (source === 'button') {
				emit({
					event: 'carousel_nav_button',
					direction,
					fromIndex: from,
					toIndex: to,
				});
			}
			if (source === 'pagination') {
				emit({event: 'carousel_pagination_click', fromIndex: from, toIndex: to});
			}
			const isWrap = direction === 'right' ? to <= from : to >= from;
			if (source !== 'auto' && !isWrap && to === store.maxIndex) {
				fireTerminalIfNeeded('reachedEnd');
			}
		};
		return () => {
			store.emitNav = null;
		};
	}, [storeRef, onEventRef, markViewed, fireTerminalIfNeeded]);

	return null;
}
