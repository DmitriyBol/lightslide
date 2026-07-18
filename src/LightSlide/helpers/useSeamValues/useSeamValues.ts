import {useMemo} from 'react';

import type {
	Dispatch,
	MutableRefObject,
	ReactNode,
	RefObject,
	SetStateAction,
} from 'react';

import type {AnalyticsSeamValue} from '../../../seams/analyticsSeam';
import type {AutoplaySeamValue} from '../../../seams/autoplaySeam';
import type {FlowSeamValue} from '../../../seams/flowSeam';
import type {FreeSeamValue} from '../../../seams/freeSeam';
import type {WheelSeamValue} from '../../../seams/wheelSeam';
import type {NavigateFn} from '../navigation';
import type {LightSlideStore} from '../store';
import type {PointerHandlers} from '../usePointerGesture/usePointerGesture';

type SeamValuesParams = {
	containerRef: RefObject<HTMLDivElement>;
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	effectiveFlow: boolean;
	pluginActive: boolean;
	wheelActive: boolean;
	autoplayActive: boolean;
	goToIndex: NavigateFn;
	setFlowHandlers: Dispatch<SetStateAction<PointerHandlers | null>>;
	setFreeHandlers: Dispatch<SetStateAction<PointerHandlers | null>>;
	childArray: ReactNode[];
};

type SeamValues = {
	flowSeamValue: FlowSeamValue;
	freeSeamValue: FreeSeamValue;
	wheelSeamValue: WheelSeamValue;
	autoplaySeamValue: AutoplaySeamValue;
	analyticsSeamValue: AnalyticsSeamValue;
};

/**
 * Builds the memoized context values for every plugin seam in one place, so LightSlide's
 * body stays a thin composition root. Each value only changes when its own inputs do (the
 * refs and setters are stable), which keeps the plugin providers from re-rendering their
 * subtree per carousel render.
 */
export function useSeamValues({
	containerRef,
	trackRef,
	storeRef,
	effectiveFlow,
	pluginActive,
	wheelActive,
	autoplayActive,
	goToIndex,
	setFlowHandlers,
	setFreeHandlers,
	childArray,
}: SeamValuesParams): SeamValues {
	const flowSeamValue = useMemo(
		() => ({
			containerRef,
			trackRef,
			storeRef,
			active: effectiveFlow,
			setPointerHandlers: setFlowHandlers,
		}),
		[containerRef, trackRef, storeRef, effectiveFlow, setFlowHandlers],
	);

	const freeSeamValue = useMemo(
		() => ({
			trackRef,
			storeRef,
			active: pluginActive,
			goToIndex,
			setPointerHandlers: setFreeHandlers,
		}),
		[trackRef, storeRef, pluginActive, goToIndex, setFreeHandlers],
	);

	const wheelSeamValue = useMemo(
		() => ({containerRef, storeRef, active: wheelActive, goToIndex}),
		[containerRef, storeRef, wheelActive, goToIndex],
	);

	const autoplaySeamValue = useMemo(
		() => ({containerRef, storeRef, active: autoplayActive, goToIndex}),
		[containerRef, storeRef, autoplayActive, goToIndex],
	);

	const analyticsSeamValue = useMemo(
		() => ({containerRef, storeRef, slides: childArray}),
		[containerRef, storeRef, childArray],
	);

	return {
		flowSeamValue,
		freeSeamValue,
		wheelSeamValue,
		autoplaySeamValue,
		analyticsSeamValue,
	};
}
