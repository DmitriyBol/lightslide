import {useEffect} from 'react';

import type {MutableRefObject, RefObject} from 'react';

import type {LightSlideStore} from '../store';

type HoverFocusParams = {
	enabled: boolean;
	containerRef: RefObject<HTMLDivElement>;
	storeRef: MutableRefObject<LightSlideStore>;
};

/**
 * Mirrors user engagement with the carousel into the store while auto motion is configured:
 * `hovered` (pointer over the container — mouse/pen only, a touch tap must not latch a
 * permanent pause) and `focusWithin` (keyboard focus inside). Auto-scroll and flow read the
 * flags on their own cadence and pause per their pauseOnHover/pauseOnFocus config; writing
 * straight to the store keeps engagement off the render path. `focusout` only clears the flag
 * when focus actually leaves the container — moving between the controls inside stays "within".
 */
export function useHoverFocus({
	enabled,
	containerRef,
	storeRef,
}: HoverFocusParams): void {
	useEffect(() => {
		const container = containerRef.current;
		if (!enabled || !container) return;

		const store = storeRef.current;
		const onPointerEnter = (e: PointerEvent) => {
			if (e.pointerType !== 'touch') store.hovered = true;
		};
		const onPointerLeave = () => {
			store.hovered = false;
		};
		const onFocusIn = () => {
			store.focusWithin = true;
		};
		const onFocusOut = (e: FocusEvent) => {
			const next = e.relatedTarget;
			if (next instanceof Node && container.contains(next)) return;
			store.focusWithin = false;
		};

		const controller = new AbortController();
		const {signal} = controller;
		container.addEventListener('pointerenter', onPointerEnter, {signal});
		container.addEventListener('pointerleave', onPointerLeave, {signal});
		container.addEventListener('focusin', onFocusIn, {signal});
		container.addEventListener('focusout', onFocusOut, {signal});
		return () => {
			controller.abort();
			store.hovered = false;
			store.focusWithin = false;
		};
	}, [enabled, containerRef, storeRef]);
}
