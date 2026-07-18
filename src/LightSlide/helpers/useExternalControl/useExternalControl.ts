import {useCallback, useEffect, useImperativeHandle} from 'react';

import type {ForwardedRef, MutableRefObject} from 'react';

import type {LightSlideHandle} from '../../../types';
import type {NavigateFn} from '../navigation';
import type {LightSlideStore} from '../store';

/** The consumer-facing control inputs plus the imperative core they drive. */
type ExternalControlParams = {
	ref: ForwardedRef<LightSlideHandle>;
	index: number | undefined;
	storeRef: MutableRefObject<LightSlideStore>;
	navigateToIndexRef: MutableRefObject<NavigateFn>;
};

/**
 * The external-control surface: the controlled `index` prop and the LightSlideHandle ref.
 * Both funnel through the same navigation path as the built-in buttons, so analytics and
 * loop wrap-around behave identically, and a same-position call is already a no-op inside
 * navigateToIndex. Ignored while the flow owns the track (continuous motion has no discrete
 * position). `step` skips the clamp so next/prev can wrap under isLoop; goTo and the
 * controlled prop clamp, so an out-of-range jump lands on the nearest edge instead of
 * wrapping. The controlled prop navigates on change only — it never locks the carousel.
 * `pause`/`resume` flip the store's apiPaused flag, which holds auto-scroll and flow (the APG
 * pause control); unlike navigation they are not gated on flow, and manual navigation keeps
 * working while paused.
 */
export function useExternalControl({
	ref,
	index,
	storeRef,
	navigateToIndexRef,
}: ExternalControlParams): void {
	const apiNavigate = useCallback(
		(target: number, step?: boolean) => {
			const s = storeRef.current;
			if (s.effectiveFlow) return;
			navigateToIndexRef.current(
				step ? target : Math.max(0, Math.min(s.maxIndex, target)),
				'api',
			);
		},
		[storeRef, navigateToIndexRef],
	);

	useEffect(() => {
		if (index !== undefined) apiNavigate(index);
	}, [index, apiNavigate]);

	useImperativeHandle(
		ref,
		() => ({
			goTo: (target: number) => apiNavigate(target),
			next: () => apiNavigate(storeRef.current.currentIndex + 1, true),
			prev: () => apiNavigate(storeRef.current.currentIndex - 1, true),
			getIndex: () => storeRef.current.currentIndex,
			pause: () => {
				storeRef.current.apiPaused = true;
			},
			resume: () => {
				storeRef.current.apiPaused = false;
			},
		}),
		[apiNavigate, storeRef],
	);
}
