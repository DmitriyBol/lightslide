import {buildSsrCss} from './ssrStyles';

/**
 * The scss-module mock (identity-obj-proxy) returns each class name verbatim, so the
 * selectors under test read as the raw map keys (.container, .viewport, …).
 */
describe('buildSsrCss', () => {
	it('emits container, stage, viewport and flex-track layout rules', () => {
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1,
			gap: 0,
			startVisual: 0,
			centered: false,
			isLoop: false,
			rtl: false,
			vertical: false,
		});

		expect(css).toContain('.container,.stage{position:relative;width:100%}');
		expect(css).toContain('.viewport{width:100%;overflow:hidden}');
		expect(css).toContain('[id=":r1:"]{display:flex}');
	});

	it('mirrors the useSlideMetrics width formula for the pre-measure slide width', () => {
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 2.5,
			gap: 16,
			startVisual: 0,
			centered: false,
			isLoop: false,
			rtl: false,
			vertical: false,
		});

		expect(css).toContain(
			'[id=":r1:"]>*{box-sizing:border-box;flex-shrink:0;width:calc((100% - 32px)/2.5)}',
		);
	});

	it('pre-positions the track for a loop/start offset and omits the rule at rest zero', () => {
		const atStart = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1,
			gap: 8,
			startVisual: 0,
			centered: false,
			isLoop: false,
			rtl: false,
			vertical: false,
		});
		const offset = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1,
			gap: 8,
			startVisual: 3,
			centered: false,
			isLoop: true,
			rtl: false,
			vertical: false,
		});

		expect(atStart).not.toContain('transform');
		expect(offset).toContain(
			'transform:translateX(calc(((100% - 0px)/1 + 8px)*-3))',
		);
	});

	it('adds the centring inset to the rest transform and clamps it without loop', () => {
		const centred = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1.5,
			gap: 0,
			startVisual: 0,
			centered: true,
			isLoop: false,
			rtl: false,
			vertical: false,
		});

		/** min(0px, …): trackOffset rests the first position flush at offset 0. */
		expect(centred).toContain(
			'transform:translateX(min(0px,calc(((100% - 0px)/1.5 + 0px)*0 + (100% - ((100% - 0px)/1.5))/2)))',
		);
	});

	it('pre-positions a centred loop without the edge clamp', () => {
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1.5,
			gap: 8,
			startVisual: 3,
			centered: true,
			isLoop: true,
			rtl: false,
			vertical: false,
		});

		expect(css).toContain(
			'transform:translateX(calc(((100% - 8px)/1.5 + 8px)*-3 + (100% - ((100% - 8px)/1.5))/2))',
		);
	});

	it('coerces malformed numeric inputs — nothing non-numeric can reach the <style> text', () => {
		/**
		 * Simulates an untyped JS consumer passing garbage through the numeric props (the
		 * casts model exactly that). The string lands in the DOM via dangerouslySetInnerHTML,
		 * so a `</style>` smuggled through `gap` would otherwise break out of the style
		 * context — the coercion must fall back to the defaults instead.
		 */
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: Number.NaN,
			gap: '</style><script>alert(1)</script>' as unknown as number,
			startVisual: Number.POSITIVE_INFINITY,
			centered: false,
			isLoop: false,
			rtl: false,
			vertical: false,
		});

		expect(css).not.toContain('script');
		expect(css).not.toContain('</style>');
		expect(css).toContain('width:calc((100% - 0px)/1)');
		expect(css).not.toContain('transform');
	});

	it('scopes every per-instance rule through the slides id', () => {
		const css = buildSsrCss({
			slidesId: '«r7»',
			slidesPerView: 3,
			gap: 10,
			startVisual: 4,
			centered: false,
			isLoop: true,
			rtl: false,
			vertical: false,
		});

		expect(css.match(/\[id="«r7»"\]/g)).toHaveLength(2);
	});

	it('swaps the axis when vertical: height chain, column track, translateY, height calc', () => {
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 2,
			gap: 8,
			startVisual: 3,
			centered: false,
			isLoop: true,
			rtl: false,
			vertical: true,
		});

		expect(css).toContain('.vertical{display:flex;flex-direction:column}');
		expect(css).toContain('.vertical .stage{flex:1;min-height:0}');
		expect(css).toContain('.vertical .viewport{height:100%}');
		expect(css).toContain(
			'[id=":r1:"]{display:flex;flex-direction:column;height:100%' +
				';transform:translateY(calc(((100% - 8px)/2 + 8px)*-3))}',
		);
		expect(css).toContain(
			'[id=":r1:"]>*{box-sizing:border-box;flex-shrink:0;height:calc((100% - 8px)/2)}',
		);
		expect(css).not.toContain('translateX');
	});

	it('scopes every vertical-only rule through the vertical class — a horizontal instance on the same page is untouched', () => {
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1,
			gap: 0,
			startVisual: 0,
			centered: false,
			isLoop: false,
			rtl: false,
			vertical: true,
		});

		/** The shared base rules must stay identical to the horizontal output. */
		expect(css).toContain('.container,.stage{position:relative;width:100%}');
		expect(css).toContain('.viewport{width:100%;overflow:hidden}');
		expect(css.match(/flex-direction:column/g)).toHaveLength(2);
	});

	it('mirrors the rest-transform sign under rtl (CSS twin of trackTransform)', () => {
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1,
			gap: 8,
			startVisual: 3,
			centered: false,
			isLoop: true,
			rtl: true,
			vertical: false,
		});

		expect(css).toContain(
			'transform:translateX(calc(((100% - 0px)/1 + 8px)*3))',
		);
	});

	it('subtracts the centring inset and clamps through max() under rtl', () => {
		const css = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1.5,
			gap: 0,
			startVisual: 0,
			centered: true,
			isLoop: false,
			rtl: true,
			vertical: false,
		});

		/** max(0px, …): the clamped offset is the translate itself when the layout is mirrored. */
		expect(css).toContain(
			'transform:translateX(max(0px,calc(((100% - 0px)/1.5 + 0px)*0 - (100% - ((100% - 0px)/1.5))/2)))',
		);
	});
});
