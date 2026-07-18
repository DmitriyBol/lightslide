import {cx} from './cx';

describe('cx', () => {
	it('joins string values with a space', () => {
		expect(cx('a', 'b', 'c')).toBe('a b c');
	});

	it('skips undefined and empty strings', () => {
		expect(cx('a', undefined, '', 'b')).toBe('a b');
	});

	it('returns undefined when nothing is present', () => {
		expect(cx(undefined, '')).toBeUndefined();
		expect(cx()).toBeUndefined();
	});

	it('supports the conditional `cond ? className : undefined` pattern', () => {
		const isActive = true;
		const isDisabled = false;
		expect(
			cx(
				'dot',
				isActive ? 'active' : undefined,
				isDisabled ? 'disabled' : undefined,
			),
		).toBe('dot active');
	});
});
