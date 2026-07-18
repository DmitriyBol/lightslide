import {useCallback, useState} from 'react';

import type {
	Dispatch,
	DragEvent,
	MutableRefObject,
	RefObject,
	SetStateAction,
} from 'react';

import type {NavigateFn} from '../navigation';
import type {LightSlideStore} from '../store';
import {useDragGesture} from '../useDragGesture/useDragGesture';
import type {PointerHandlers} from '../usePointerGesture/usePointerGesture';

type GestureHandlersParams = {
	trackRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
	snapToVisual: (
		visualIndex: number,
		animate: boolean,
		onComplete?: () => void,
	) => void;
	goToIndex: NavigateFn;
	effectiveFlow: boolean;
};

type GestureHandlers = {
	pointerHandlers: PointerHandlers;
	preventNativeDrag: (e: DragEvent<HTMLDivElement>) => void;
	setFlowHandlers: Dispatch<SetStateAction<PointerHandlers | null>>;
	setFreeHandlers: Dispatch<SetStateAction<PointerHandlers | null>>;
};

/**
 * Decides which pointer-handler bag owns the viewport. The built-in drag-to-snap is the
 * fallback; plugin-owned gestures replace it through the seams — while the flow is active its
 * plugin owns the track outright, otherwise a mounted free plugin's momentum handlers take
 * over. The setters are handed to the flow/free seams; `preventNativeDrag` accompanies the
 * bag because native image/anchor drag-and-drop would otherwise hijack any pointer gesture.
 */
export function useGestureHandlers({
	trackRef,
	storeRef,
	snapToVisual,
	goToIndex,
	effectiveFlow,
}: GestureHandlersParams): GestureHandlers {
	const dragHandlers = useDragGesture({
		trackRef,
		storeRef,
		snapToVisual,
		goToIndex,
	});

	const [flowHandlers, setFlowHandlers] = useState<PointerHandlers | null>(
		null,
	);
	const [freeHandlers, setFreeHandlers] = useState<PointerHandlers | null>(
		null,
	);
	const pointerHandlers =
		effectiveFlow && flowHandlers ? flowHandlers : (freeHandlers ?? dragHandlers);

	const preventNativeDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	}, []);

	return {pointerHandlers, preventNativeDrag, setFlowHandlers, setFreeHandlers};
}
