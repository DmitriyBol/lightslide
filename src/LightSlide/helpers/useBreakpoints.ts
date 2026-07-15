import {useCallback, useSyncExternalStore} from 'react';

import type {BreakpointOverrides} from '../../types';

/**
 * Resolves the `breakpoints` prop into the overrides of the currently matching media
 * queries, merged in declaration order (later matching entries win per property). The
 * subscription is keyed on the query list, not the record's identity, so an inline prop
 * object doesn't resubscribe every render; the snapshot is a compact match signature (one
 * '0'/'1' per query), so only an actual breakpoint flip re-renders — resize noise inside one
 * breakpoint never does. SSR-safe: without `matchMedia` (server / jsdom) nothing matches and
 * the base props apply; the client re-evaluates on hydration.
 */
export function useBreakpoints(
	breakpoints?: Record<string, BreakpointOverrides>,
): BreakpointOverrides | undefined {
	const queriesKey = breakpoints ? Object.keys(breakpoints).join('\n') : '';

	const subscribe = useCallback(
		(onChange: () => void) => {
			if (!queriesKey || typeof matchMedia !== 'function') return () => {};
			const lists = queriesKey.split('\n').map(query => matchMedia(query));
			lists.forEach(list => list.addEventListener('change', onChange));
			return () =>
				lists.forEach(list => list.removeEventListener('change', onChange));
		},
		[queriesKey],
	);

	const getMatches = useCallback(() => {
		if (!queriesKey || typeof matchMedia !== 'function') return '';
		return queriesKey
			.split('\n')
			.map(query => (matchMedia(query).matches ? '1' : '0'))
			.join('');
	}, [queriesKey]);

	const getServerMatches = useCallback(() => '', []);

	const matches = useSyncExternalStore(subscribe, getMatches, getServerMatches);

	if (!breakpoints || !matches.includes('1')) return undefined;
	let overrides: BreakpointOverrides = {};
	Object.values(breakpoints).forEach((entry, i) => {
		if (matches[i] === '1') overrides = {...overrides, ...entry};
	});
	return overrides;
}
