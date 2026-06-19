import type {ReactElement} from 'react';

import {buildLoopChildren} from './loopClones';

const slides = [
	<div key="a">A</div>,
	<div key="b">B</div>,
	<div key="c">C</div>,
];

describe('buildLoopChildren', () => {
	it('returns the original array unchanged when loopOffset is 0', () => {
		expect(buildLoopChildren(slides, 3, 0)).toBe(slides);
	});

	it('returns the original array when there are no slides', () => {
		expect(buildLoopChildren([], 0, 2)).toEqual([]);
	});

	it('prepends the last N and appends the first N as keyed clones', () => {
		const result = buildLoopChildren(slides, 3, 1);
		// 1 prepend clone + 3 real + 1 append clone
		expect(result).toHaveLength(5);
		expect((result[0] as ReactElement).key).toBe('__loop_pre_0');
		expect((result[4] as ReactElement).key).toBe('__loop_post_0');
		// the 3 real slides sit unchanged in the middle
		expect(result.slice(1, 4)).toEqual(slides);
	});

	it('clones loopOffset slides from each end for larger offsets', () => {
		const result = buildLoopChildren(slides, 3, 2);
		expect(result).toHaveLength(7); // 2 + 3 + 2
		expect((result[0] as ReactElement).key).toBe('__loop_pre_0');
		expect((result[1] as ReactElement).key).toBe('__loop_pre_1');
		expect((result[5] as ReactElement).key).toBe('__loop_post_0');
		expect((result[6] as ReactElement).key).toBe('__loop_post_1');
	});
});
