import {fireEvent} from '@testing-library/dom';
import {renderHook} from '@testing-library/react';

import {createStore} from '../store';
import {useHoverFocus} from './useHoverFocus';

/**
 * jsdom has no PointerEvent, and fireEvent's Event fallback drops `pointerType` — build the
 * event by hand so the touch/mouse distinction actually reaches the handler.
 */
function firePointer(
	el: Element,
	type: 'pointerenter' | 'pointerleave',
	pointerType: string,
) {
	const event = new Event(type);
	Object.defineProperty(event, 'pointerType', {value: pointerType});
	el.dispatchEvent(event);
}

function setup(enabled = true) {
	const container = document.createElement('div');
	const inner = document.createElement('button');
	container.appendChild(inner);
	document.body.appendChild(container);

	const storeRef = {current: createStore()};
	const view = renderHook(() =>
		useHoverFocus({enabled, containerRef: {current: container}, storeRef}),
	);
	return {container, inner, storeRef, unmount: view.unmount};
}

describe('useHoverFocus', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('mirrors pointer enter/leave into store.hovered', () => {
		const {container, storeRef} = setup();

		firePointer(container, 'pointerenter', 'mouse');
		expect(storeRef.current.hovered).toBe(true);

		firePointer(container, 'pointerleave', 'mouse');
		expect(storeRef.current.hovered).toBe(false);
	});

	it('ignores touch pointer enter (a tap must not latch a permanent pause)', () => {
		const {container, storeRef} = setup();

		firePointer(container, 'pointerenter', 'touch');
		expect(storeRef.current.hovered).toBe(false);
	});

	it('mirrors focus entering and leaving into store.focusWithin', () => {
		const {container, storeRef} = setup();

		fireEvent.focusIn(container);
		expect(storeRef.current.focusWithin).toBe(true);

		fireEvent.focusOut(container, {relatedTarget: document.body});
		expect(storeRef.current.focusWithin).toBe(false);
	});

	it('keeps focusWithin while focus moves between elements inside the container', () => {
		const {container, inner, storeRef} = setup();

		fireEvent.focusIn(container);
		fireEvent.focusOut(container, {relatedTarget: inner});
		expect(storeRef.current.focusWithin).toBe(true);
	});

	it('clears focusWithin when focus is lost to nowhere (relatedTarget null)', () => {
		const {container, storeRef} = setup();

		fireEvent.focusIn(container);
		fireEvent.focusOut(container, {relatedTarget: null});
		expect(storeRef.current.focusWithin).toBe(false);
	});

	it('does not listen when disabled', () => {
		const {container, storeRef} = setup(false);

		firePointer(container, 'pointerenter', 'mouse');
		fireEvent.focusIn(container);
		expect(storeRef.current.hovered).toBe(false);
		expect(storeRef.current.focusWithin).toBe(false);
	});

	it('resets both flags on unmount so a stale pause cannot stick', () => {
		const {container, storeRef, unmount} = setup();

		firePointer(container, 'pointerenter', 'mouse');
		fireEvent.focusIn(container);
		unmount();

		expect(storeRef.current.hovered).toBe(false);
		expect(storeRef.current.focusWithin).toBe(false);
	});
});
