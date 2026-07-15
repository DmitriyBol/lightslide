import {useRef} from 'react';

import type {MutableRefObject} from 'react';

/**
 * Keeps a ref pointing at the latest value of a render-scoped input, so stable callbacks can
 * read fresh props/state without widening their dependency arrays or re-creating themselves.
 */
export function useLatestRef<V>(value: V): MutableRefObject<V> {
	const ref = useRef(value);
	ref.current = value;
	return ref;
}
