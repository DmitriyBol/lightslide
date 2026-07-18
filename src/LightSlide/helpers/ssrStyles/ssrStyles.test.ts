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
		});
		const offset = buildSsrCss({
			slidesId: ':r1:',
			slidesPerView: 1,
			gap: 8,
			startVisual: 3,
			centered: false,
			isLoop: true,
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
		});

		expect(css).toContain(
			'transform:translateX(calc(((100% - 8px)/1.5 + 8px)*-3 + (100% - ((100% - 8px)/1.5))/2))',
		);
	});

	it('scopes every per-instance rule through the slides id', () => {
		const css = buildSsrCss({
			slidesId: '«r7»',
			slidesPerView: 3,
			gap: 10,
			startVisual: 4,
			centered: false,
			isLoop: true,
		});

		expect(css.match(/\[id="«r7»"\]/g)).toHaveLength(2);
	});
});
