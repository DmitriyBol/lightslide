import {prefersReducedMotion} from './reducedMotion';

/** jsdom ships no matchMedia, so each test installs (and removes) its own. */
function installMatchMedia(matches: boolean) {
	const fn = jest.fn().mockReturnValue({matches});
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		writable: true,
		value: fn,
	});
	return fn;
}

describe('prefersReducedMotion', () => {
	afterEach(() => {
		Reflect.deleteProperty(window, 'matchMedia');
	});

	it('defaults to motion-allowed where matchMedia does not exist (SSR, jsdom)', () => {
		expect(prefersReducedMotion()).toBe(false);
	});

	it('is true when the reduce preference matches', () => {
		const matchMedia = installMatchMedia(true);
		expect(prefersReducedMotion()).toBe(true);
		expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
	});

	it('is false when the query does not match', () => {
		installMatchMedia(false);
		expect(prefersReducedMotion()).toBe(false);
	});
});
