import type {ReactElement} from 'react';

import {buildDisplayChildren} from './loopClones';

const slides = [
	<div key="a">A</div>,
	<div key="b">B</div>,
	<div key="c">C</div>,
];

type AnyProps = Record<string, unknown>;
const propsOf = (node: unknown) => (node as ReactElement).props as AnyProps;

describe('buildDisplayChildren', () => {
	it('decorates every real slide with per-slide ARIA when looping is off', () => {
		const result = buildDisplayChildren(slides, 3, 0);
		expect(result).toHaveLength(3);
		result.forEach((node, i) => {
			const props = propsOf(node);
			expect(props.role).toBe('group');
			expect(props['aria-roledescription']).toBe('slide');
			expect(props['aria-label']).toBe(`${i + 1} of 3`);
		});
	});

	it('returns an empty array when there are no slides', () => {
		expect(buildDisplayChildren([], 0, 2)).toEqual([]);
	});

	it('prepends the last N and appends the first N as hidden, inert, keyed clones', () => {
		const result = buildDisplayChildren(slides, 3, 1);
		// 1 prepend clone + 3 real + 1 append clone
		expect(result).toHaveLength(5);
		expect((result[0] as ReactElement).key).toBe('__loop_pre_0');
		expect((result[4] as ReactElement).key).toBe('__loop_post_0');

		// clones are hidden from assistive tech and removed from the tab order
		for (const clone of [result[0], result[4]]) {
			const props = propsOf(clone);
			expect(props['aria-hidden']).toBe(true);
			expect(props.inert).toBe('');
			// no redundant "N of M" label on an already-hidden node
			expect(props['aria-label']).toBeUndefined();
		}

		// the 3 real slides sit labelled in the middle
		result.slice(1, 4).forEach((node, i) => {
			expect(propsOf(node)['aria-label']).toBe(`${i + 1} of 3`);
		});
	});

	it('clones loopOffset slides from each end for larger offsets', () => {
		const result = buildDisplayChildren(slides, 3, 2);
		expect(result).toHaveLength(7); // 2 + 3 + 2
		expect((result[0] as ReactElement).key).toBe('__loop_pre_0');
		expect((result[1] as ReactElement).key).toBe('__loop_pre_1');
		expect((result[5] as ReactElement).key).toBe('__loop_post_0');
		expect((result[6] as ReactElement).key).toBe('__loop_post_1');
	});

	it('passes non-element children (text nodes) through untouched', () => {
		const mixed = ['plain text', <div key="b">B</div>];
		const result = buildDisplayChildren(mixed, 2, 0);
		expect(result[0]).toBe('plain text');
		expect(propsOf(result[1])['aria-label']).toBe('2 of 2');
	});
});
