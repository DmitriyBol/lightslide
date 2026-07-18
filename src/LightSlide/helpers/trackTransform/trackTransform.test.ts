import {trackTransform} from './trackTransform';

describe('trackTransform', () => {
	it('negates the offset for ltr', () => {
		expect(trackTransform(600, 1)).toBe('translateX(-600px)');
	});

	it('mirrors the sign for rtl — the mirrored flex layout scrolls translateX-positive', () => {
		expect(trackTransform(600, -1)).toBe('translateX(600px)');
	});

	it('renders a clean zero in both directions', () => {
		expect(trackTransform(0, 1)).toBe('translateX(0px)');
		expect(trackTransform(0, -1)).toBe('translateX(0px)');
	});
});
