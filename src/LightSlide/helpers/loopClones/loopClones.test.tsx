import type {ReactElement} from 'react';

import {buildDisplayChildren} from './loopClones';

const slides = [
	<div key="a">A</div>,
	<div key="b">B</div>,
	<div key="c">C</div>,
];

/** The default "N of M" labeler LightSlide passes in. */
const label = (index: number, count: number) => `${index + 1} of ${count}`;

type AnyProps = Record<string, unknown>;
const propsOf = (node: unknown) => (node as ReactElement).props as AnyProps;

describe('buildDisplayChildren', () => {
	it('decorates every real slide with per-slide ARIA when looping is off', () => {
		const result = buildDisplayChildren(slides, 3, 0, label);
		expect(result).toHaveLength(3);
		result.forEach((node, i) => {
			const props = propsOf(node);
			expect(props.role).toBe('group');
			expect(props['aria-roledescription']).toBe('slide');
			expect(props['aria-label']).toBe(`${i + 1} of 3`);
		});
	});

	it('returns an empty array when there are no slides', () => {
		expect(buildDisplayChildren([], 0, 2, label)).toEqual([]);
	});

	it('prepends the last N and appends the first N as hidden, inert, keyed clones', () => {
		const result = buildDisplayChildren(slides, 3, 1, label);
		/** 1 prepend clone + 3 real + 1 append clone */
		expect(result).toHaveLength(5);
		expect((result[0] as ReactElement).key).toBe('__loop_pre_0');
		expect((result[4] as ReactElement).key).toBe('__loop_post_0');

		/** clones are hidden from assistive tech and removed from the tab order */
		for (const clone of [result[0], result[4]]) {
			const props = propsOf(clone);
			expect(props['aria-hidden']).toBe(true);
			expect(props.inert).toBe('');
			/** no redundant "N of M" label on an already-hidden node */
			expect(props['aria-label']).toBeUndefined();
			/** a grab over a clone must fall through to the track (inert swallows pointer events) */
			expect((props.style as {pointerEvents?: string}).pointerEvents).toBe(
				'none',
			);
		}

		/** the 3 real slides sit labelled in the middle */
		result.slice(1, 4).forEach((node, i) => {
			expect(propsOf(node)['aria-label']).toBe(`${i + 1} of 3`);
		});
	});

	it('merges the consumer style into a clone under pointer-events none', () => {
		const styled = [
			<div key="a" style={{padding: '0 5px'}}>
				A
			</div>,
			<div key="b">B</div>,
		];
		const result = buildDisplayChildren(styled, 2, 1, label);
		/** append clone copies slide A — its padding must survive the merge */
		const style = propsOf(result[3]).style as Record<string, string>;
		expect(style.padding).toBe('0 5px');
		expect(style.pointerEvents).toBe('none');
	});

	it('clones loopOffset slides from each end for larger offsets', () => {
		const result = buildDisplayChildren(slides, 3, 2, label);
		expect(result).toHaveLength(7); /** 2 + 3 + 2 */
		expect((result[0] as ReactElement).key).toBe('__loop_pre_0');
		expect((result[1] as ReactElement).key).toBe('__loop_pre_1');
		expect((result[5] as ReactElement).key).toBe('__loop_post_0');
		expect((result[6] as ReactElement).key).toBe('__loop_post_1');
	});

	it('passes non-element children (text nodes) through untouched', () => {
		const mixed = ['plain text', <div key="b">B</div>];
		const result = buildDisplayChildren(mixed, 2, 0, label);
		expect(result[0]).toBe('plain text');
		expect(propsOf(result[1])['aria-label']).toBe('2 of 2');
	});

	it('lets a consumer aria-label win over the automatic "N of M"', () => {
		const custom = [
			<div key="a" aria-label="Ray-Ban Wayfarer">
				A
			</div>,
			<div key="b">B</div>,
		];
		const result = buildDisplayChildren(custom, 2, 0, label);
		/** consumer name kept; still tagged as a slide group */
		expect(propsOf(result[0])['aria-label']).toBe('Ray-Ban Wayfarer');
		expect(propsOf(result[0])['aria-roledescription']).toBe('slide');
		/** the un-labelled slide still gets the automatic name */
		expect(propsOf(result[1])['aria-label']).toBe('2 of 2');
	});

	it('does not add an automatic aria-label when the consumer uses aria-labelledby', () => {
		const custom = [
			<div key="a" aria-labelledby="heading-a">
				A
			</div>,
		];
		const result = buildDisplayChildren(custom, 1, 0, label);
		expect(propsOf(result[0])['aria-label']).toBeUndefined();
		expect(propsOf(result[0])['aria-labelledby']).toBe('heading-a');
	});

	it('uses a custom slideLabel formatter', () => {
		const result = buildDisplayChildren(
			slides,
			3,
			0,
			(i, n) => `${i + 1} / ${n}`,
		);
		expect(propsOf(result[0])['aria-label']).toBe('1 / 3');
		expect(propsOf(result[2])['aria-label']).toBe('3 / 3');
	});

	it('hollows out slides outside the lazy window but keeps their props and ARIA', () => {
		const styled = [
			<div key="a" className="card" style={{height: 100}}>
				A
			</div>,
			<div key="b">B</div>,
			<div key="c">C</div>,
		];
		const result = buildDisplayChildren(styled, 3, 0, label, i => i > 0);

		const hollow = propsOf(result[0]);
		expect(hollow.children).toBeNull();
		expect(hollow.className).toBe('card');
		expect((hollow.style as {height?: number}).height).toBe(100);
		expect(hollow['aria-label']).toBe('1 of 3');

		expect(propsOf(result[1]).children).toBe('B');
		expect(propsOf(result[2]).children).toBe('C');
	});

	it('mounts a loop clone exactly when its original slide is mounted', () => {
		/** window = slide 0 only: the append clone (of slide 0) keeps content, the prepend clone (of slide 2) is hollow */
		const result = buildDisplayChildren(slides, 3, 1, label, i => i === 0);

		expect(propsOf(result[0]).children).toBeNull();
		expect(propsOf(result[4]).children).toBe('A');
		expect(propsOf(result[1]).children).toBe('A');
		expect(propsOf(result[2]).children).toBeNull();
		expect(propsOf(result[3]).children).toBeNull();
	});

	it('passes non-element children through even outside the lazy window', () => {
		const mixed = ['plain text', <div key="b">B</div>];
		const result = buildDisplayChildren(mixed, 2, 0, label, () => false);
		expect(result[0]).toBe('plain text');
		expect(propsOf(result[1]).children).toBeNull();
	});
});
