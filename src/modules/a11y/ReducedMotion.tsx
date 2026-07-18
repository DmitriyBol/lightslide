import {useEffect} from 'react';

import {useA11yContext} from '../../seams/a11ySeam';

/**
 * Honours `prefers-reduced-motion: reduce` for automatic movement: while the user prefers reduced
 * motion, it closes the core's motion gate, which stops flow / auto-scroll (slide-snap is already
 * instant — the core handles that without this plugin). Reacts live to the media query changing,
 * and reopens the gate when unmounted. No-op where matchMedia is unavailable (SSR / jsdom).
 */
export function ReducedMotion() {
	const {setMotionAllowed} = useA11yContext();

	useEffect(() => {
		if (typeof matchMedia !== 'function') return;

		const mq = matchMedia('(prefers-reduced-motion: reduce)');
		const apply = () => setMotionAllowed(!mq.matches);
		apply();

		mq.addEventListener('change', apply);
		return () => {
			mq.removeEventListener('change', apply);
			setMotionAllowed(true);
		};
	}, [setMotionAllowed]);

	return null;
}
