import {cx} from './cx';

describe('cx', () => {
	it('joins truthy string values with a space', () => {
		expect(cx('a', 'b', 'c')).toBe('a b c');
	});

	it('skips false, null, undefined, and empty strings', () => {
		expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
	});

	it('returns undefined when nothing is truthy', () => {
		expect(cx(false, null, undefined, '')).toBeUndefined();
		expect(cx()).toBeUndefined();
	});

	it('supports the conditional `cond && className` pattern', () => {
		const isActive = true;
		const isDisabled = false;
		expect(cx('dot', isActive && 'active', isDisabled && 'disabled')).toBe(
			'dot active',
		);
	});

	it('flattens nested arrays and ignores their falsy entries', () => {
		expect(cx('a', ['b', false, ['c']], undefined)).toBe('a b c');
	});

	it('skips 0 but keeps non-zero numbers', () => {
		expect(cx(0, 5, 'x')).toBe('5 x');
	});
});
