import {renderHook} from '@testing-library/react';

import {createStore} from './store';
import {useWheel} from './useWheel';

/** Dispatches a cancelable wheel event and returns it so tests can assert defaultPrevented. */
function fireWheel(el: Element, init: WheelEventInit): WheelEvent {
	const event = new WheelEvent('wheel', {cancelable: true, ...init});
	el.dispatchEvent(event);
	return event;
}

function setup(
	overrides: Record<string, unknown> = {},
	storeOverrides: Record<string, unknown> = {},
) {
	const container = document.createElement('div');
	document.body.appendChild(container);

	const storeRef = {
		current: createStore({
			slideCount: 4,
			maxIndex: 3,
			currentIndex: 1,
			...storeOverrides,
		}),
	};
	const navigate = jest.fn();
	const params = {
		enabled: true,
		threshold: 30,
		containerRef: {current: container},
		storeRef,
		navigate,
		...overrides,
	};
	const view = renderHook(() =>
		useWheel(params as Parameters<typeof useWheel>[0]),
	);
	return {container, storeRef, navigate, unmount: view.unmount};
}

describe('useWheel', () => {
	/** The hook timestamps events via Date.now() — modern fake timers make it deterministic. */
	beforeEach(() => {
		jest.useFakeTimers();
	});
	afterEach(() => {
		jest.useRealTimers();
		document.body.innerHTML = '';
	});

	it('accumulates horizontal deltas and pages forward once the threshold is crossed', () => {
		const {container, navigate} = setup();

		const first = fireWheel(container, {deltaX: 20});
		expect(navigate).not.toHaveBeenCalled();
		expect(first.defaultPrevented).toBe(true);

		const second = fireWheel(container, {deltaX: 20});
		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith(2, 'drag');
		expect(second.defaultPrevented).toBe(true);
	});

	it('pages backward on accumulated negative deltas', () => {
		const {container, navigate} = setup();

		fireWheel(container, {deltaX: -35});
		expect(navigate).toHaveBeenCalledWith(0, 'drag');
	});

	it('leaves vertical-dominant events alone so the page keeps scrolling', () => {
		const {container, navigate} = setup();

		const event = fireWheel(container, {deltaX: 5, deltaY: 40});
		expect(event.defaultPrevented).toBe(false);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('swallows the inertia tail after a committed page turn', () => {
		const {container, navigate} = setup();

		fireWheel(container, {deltaX: 40});
		fireWheel(container, {deltaX: 20});
		fireWheel(container, {deltaX: 10});
		fireWheel(container, {deltaX: 5});
		expect(navigate).toHaveBeenCalledTimes(1);
	});

	it('re-arms after a silence gap ends the gesture', () => {
		const {container, navigate} = setup();

		fireWheel(container, {deltaX: 40});
		jest.advanceTimersByTime(200);
		fireWheel(container, {deltaX: 40});
		expect(navigate).toHaveBeenCalledTimes(2);
	});

	it('treats a sharply rising delta inside the tail as a new impulse', () => {
		const {container, navigate} = setup();

		fireWheel(container, {deltaX: 40});
		fireWheel(container, {deltaX: 10});
		fireWheel(container, {deltaX: 40});
		expect(navigate).toHaveBeenCalledTimes(2);
	});

	it('keeps swallowing a decaying tail that never rises', () => {
		const {container, navigate} = setup();

		fireWheel(container, {deltaX: 40});
		fireWheel(container, {deltaX: 30});
		fireWheel(container, {deltaX: 31});
		expect(navigate).toHaveBeenCalledTimes(1);
	});

	it('normalizes line-mode deltas to px', () => {
		const {container, navigate} = setup();

		/** 2 lines × 16 px = 32 px ≥ threshold 30 → one event is enough. */
		fireWheel(container, {deltaX: 2, deltaMode: 1});
		expect(navigate).toHaveBeenCalledWith(2, 'drag');
	});

	it('treats shift+vertical wheel as horizontal (Firefox keeps it on deltaY)', () => {
		const {container, navigate} = setup();

		const event = fireWheel(container, {deltaY: 35, shiftKey: true});
		expect(event.defaultPrevented).toBe(true);
		expect(navigate).toHaveBeenCalledWith(2, 'drag');
	});

	it('routes deltas into the store mailbox instead of paging while flow runs', () => {
		const {container, storeRef, navigate} = setup({}, {effectiveFlow: true});

		const event = fireWheel(container, {deltaX: 25});
		fireWheel(container, {deltaX: 10});
		expect(event.defaultPrevented).toBe(true);
		expect(storeRef.current.wheelDeltaX).toBe(35);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('does not listen when disabled', () => {
		const {container, navigate} = setup({enabled: false});

		const event = fireWheel(container, {deltaX: 40});
		expect(event.defaultPrevented).toBe(false);
		expect(navigate).not.toHaveBeenCalled();
	});

	it('clears the flow mailbox on unmount so no stale drift survives a remount', () => {
		const {container, storeRef, unmount} = setup({}, {effectiveFlow: true});

		fireWheel(container, {deltaX: 25});
		expect(storeRef.current.wheelDeltaX).toBe(25);
		unmount();
		expect(storeRef.current.wheelDeltaX).toBe(0);
	});
});
