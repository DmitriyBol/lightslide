import {act, renderHook} from '@testing-library/react';

import {useBreakpoints} from './useBreakpoints';

/** Controllable multi-query matchMedia: flip a query's `matches` and fire its listeners. */
function installMatchMedia(initialMatching: string[] = []) {
	const matching = new Set(initialMatching);
	const listeners = new Map<string, Set<() => void>>();
	window.matchMedia = ((query: string) => ({
		get matches() {
			return matching.has(query);
		},
		media: query,
		addEventListener: (_type: string, l: () => void) => {
			const set = listeners.get(query) ?? new Set<() => void>();
			set.add(l);
			listeners.set(query, set);
		},
		removeEventListener: (_type: string, l: () => void) => {
			listeners.get(query)?.delete(l);
		},
	})) as unknown as typeof window.matchMedia;
	return {
		change(query: string, matches: boolean) {
			if (matches) matching.add(query);
			else matching.delete(query);
			listeners.get(query)?.forEach(l => l());
		},
	};
}

describe('useBreakpoints', () => {
	const original = window.matchMedia;
	afterEach(() => {
		window.matchMedia = original;
	});

	it('returns undefined with no breakpoints', () => {
		installMatchMedia();
		const {result} = renderHook(() => useBreakpoints(undefined));
		expect(result.current).toBeUndefined();
	});

	it('returns undefined while no query matches', () => {
		installMatchMedia();
		const {result} = renderHook(() =>
			useBreakpoints({'(min-width: 768px)': {slidesPerView: 2}}),
		);
		expect(result.current).toBeUndefined();
	});

	it('returns the overrides of a matching query', () => {
		installMatchMedia(['(min-width: 768px)']);
		const {result} = renderHook(() =>
			useBreakpoints({'(min-width: 768px)': {slidesPerView: 2, gap: 16}}),
		);
		expect(result.current).toEqual({slidesPerView: 2, gap: 16});
	});

	it('merges matching queries in declaration order, later entries winning per property', () => {
		installMatchMedia(['(min-width: 768px)', '(min-width: 1200px)']);
		const {result} = renderHook(() =>
			useBreakpoints({
				'(min-width: 768px)': {slidesPerView: 2, gap: 16},
				'(min-width: 1200px)': {slidesPerView: 3},
			}),
		);
		expect(result.current).toEqual({slidesPerView: 3, gap: 16});
	});

	it('ignores overrides of non-matching queries in a multi-query record', () => {
		installMatchMedia(['(min-width: 768px)']);
		const {result} = renderHook(() =>
			useBreakpoints({
				'(min-width: 768px)': {slidesPerView: 2},
				'(min-width: 1200px)': {slidesPerView: 3, gap: 24},
			}),
		);
		expect(result.current).toEqual({slidesPerView: 2});
	});

	it('reacts live to a query flipping both ways', () => {
		const mm = installMatchMedia();
		const {result} = renderHook(() =>
			useBreakpoints({'(min-width: 768px)': {slidesPerView: 2}}),
		);
		expect(result.current).toBeUndefined();
		act(() => mm.change('(min-width: 768px)', true));
		expect(result.current).toEqual({slidesPerView: 2});
		act(() => mm.change('(min-width: 768px)', false));
		expect(result.current).toBeUndefined();
	});

	it('survives the breakpoints record being a new object every render', () => {
		const mm = installMatchMedia();
		const {result, rerender} = renderHook(
			(spv: number) => useBreakpoints({'(min-width: 768px)': {slidesPerView: spv}}),
			{initialProps: 2},
		);
		rerender(3);
		act(() => mm.change('(min-width: 768px)', true));
		expect(result.current).toEqual({slidesPerView: 3});
	});

	it('falls back to the base props where matchMedia is unavailable', () => {
		 
		// @ts-expect-error — deleting the optional global for this case
		delete window.matchMedia;
		const {result} = renderHook(() =>
			useBreakpoints({'(min-width: 768px)': {slidesPerView: 2}}),
		);
		expect(result.current).toBeUndefined();
	});
});
