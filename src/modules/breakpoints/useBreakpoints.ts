import {useCallback, useSyncExternalStore} from 'react';

/**
 * Responsive prop resolution as a hook — the `lightslide/breakpoints` entry. Runs in the
 * consumer's render, ABOVE the carousel, so the resolved values are already in the props on
 * the very first render (no post-mount flash, and server markup + SSR critical CSS get the
 * base values — the same thing a client without `matchMedia` sees).
 *
 * `base` is the value for "no query matches"; each `breakpoints` key is a media query whose
 * partial overrides apply while it matches, merged in declaration order (later matching
 * entries win per property) — order them mobile-first and it behaves like CSS:
 *
 *   const layout = useBreakpoints(
 *   	{slidesPerView: 1.2, gap: 8},
 *   	{'(min-width: 768px)': {slidesPerView: 2, gap: 16}},
 *   );
 *   <LightSlide {...layout} />
 *
 * Generic over the base shape, so any prop set can respond to breakpoints — geometry
 * (slidesPerView/gap) flows through the carousel's re-measure/re-clamp/re-snap path, and any
 * other prop follows the normal prop-change path. The subscription is keyed on the query
 * list, not the record's identity, so an inline object doesn't resubscribe every render; the
 * snapshot is a compact match signature (one '0'/'1' per query), so only an actual
 * breakpoint flip re-renders — resize noise inside one breakpoint never does.
 */
export function useBreakpoints<T extends object>(
	base: T,
	breakpoints: Record<string, Partial<T>>,
): T {
	const queriesKey = Object.keys(breakpoints).join('\n');

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

	if (!matches.includes('1')) return base;
	let resolved: T = {...base};
	Object.values(breakpoints).forEach((entry, i) => {
		if (matches[i] === '1') resolved = {...resolved, ...entry};
	});
	return resolved;
}
