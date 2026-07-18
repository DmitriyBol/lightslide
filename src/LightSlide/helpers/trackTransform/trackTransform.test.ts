import {trackTransform} from './trackTransform';

describe('trackTransform', () => {
	it('negates the offset for ltr', () => {
		expect(trackTransform(600, {dirSign: 1, vertical: false})).toBe(
			'translateX(-600px)',
		);
	});

	it('mirrors the sign for rtl — the mirrored flex layout scrolls translateX-positive', () => {
		expect(trackTransform(600, {dirSign: -1, vertical: false})).toBe(
			'translateX(600px)',
		);
	});

	it('writes translateY on the vertical axis', () => {
		expect(trackTransform(600, {dirSign: 1, vertical: true})).toBe(
			'translateY(-600px)',
		);
	});

	it('renders a clean zero in both directions', () => {
		expect(trackTransform(0, {dirSign: 1, vertical: false})).toBe(
			'translateX(0px)',
		);
		expect(trackTransform(0, {dirSign: -1, vertical: false})).toBe(
			'translateX(0px)',
		);
	});
});
