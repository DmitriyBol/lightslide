import {useMemo} from 'react';

import type {ReactNode} from 'react';

import type {LazyMountConfig} from '../../../types';
import {buildMountPredicate, DEFAULT_LAZY_MARGIN} from '../lazyMount/lazyMount';
import {buildDisplayChildren} from '../loopClones/loopClones';

type DisplayChildrenParams = {
	childArray: ReactNode[];
	slideCount: number;
	slidesPerView: number;
	maxIndex: number;
	currentIndex: number;
	loopOffset: number;
	effectiveLoop: boolean;
	effectiveFlow: boolean;
	isCentered: boolean;
	lazyMount: boolean | LazyMountConfig | undefined;
	slideLabel: (index: number, count: number) => string;
};

/**
 * Derives the rendered track children from the raw slide children: per-slide ARIA, loop
 * clones, and the lazyMount window. Lazy mounting keys off the settled currentIndex (cheap,
 * synchronous with the geometry), so it only applies where the track has a resting window —
 * flow's continuous motion turns it off. While active, the derivation recomputes per
 * navigation; memoized slides whose window state didn't change skip.
 */
export function useDisplayChildren({
	childArray,
	slideCount,
	slidesPerView,
	maxIndex,
	currentIndex,
	loopOffset,
	effectiveLoop,
	effectiveFlow,
	isCentered,
	lazyMount,
	slideLabel,
}: DisplayChildrenParams): ReactNode[] {
	const lazyActive = lazyMount ? !effectiveFlow : false;
	const lazyMargin =
		typeof lazyMount === 'object'
			? (lazyMount.margin ?? DEFAULT_LAZY_MARGIN)
			: DEFAULT_LAZY_MARGIN;

	const isSlideMounted = useMemo(
		() =>
			lazyActive
				? buildMountPredicate(
						currentIndex,
						slideCount,
						slidesPerView,
						maxIndex,
						effectiveLoop,
						lazyMargin,
						isCentered,
					)
				: null,
		[
			lazyActive,
			currentIndex,
			slideCount,
			slidesPerView,
			maxIndex,
			effectiveLoop,
			lazyMargin,
			isCentered,
		],
	);

	return useMemo(
		() =>
			buildDisplayChildren(
				childArray,
				slideCount,
				loopOffset,
				slideLabel,
				isSlideMounted,
			),
		[childArray, slideCount, loopOffset, slideLabel, isSlideMounted],
	);
}
