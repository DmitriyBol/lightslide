import {useEffect, useRef} from 'react';

import {useA11yContext} from '../../seams/a11ySeam';

const EDITABLE = /^(INPUT|TEXTAREA|SELECT)$/;

/**
 * Arrow-key navigation. Left/Right step one slide, Home/End jump to the first/last position;
 * wrap-around at the ends follows the carousel's loop mode (via the shared navigate path). The
 * listener lives on the carousel container, so it only fires when focus is already inside the
 * carousel — reached by tabbing to its nav buttons, dots, or focusable slide content. Keydowns
 * originating in a form field are left alone so typing (and native caret movement) is untouched.
 * The reactive bits are read through a latest-ref, so the listener binds once on mount and is
 * never re-bound per navigation.
 */
export function Keyboard() {
	const ctx = useA11yContext();
	const latest = useRef(ctx);
	latest.current = ctx;

	useEffect(() => {
		const el = latest.current.containerRef.current;
		if (!el) return;

		const onKeyDown = (e: KeyboardEvent) => {
			const {currentIndex, maxIndex, goToIndex} = latest.current;

			const target = e.target as HTMLElement | null;
			if (
				target &&
				(target.isContentEditable || EDITABLE.test(target.tagName))
			) {
				return;
			}

			let next: number;
			switch (e.key) {
				case 'ArrowLeft':
					next = currentIndex - 1;
					break;
				case 'ArrowRight':
					next = currentIndex + 1;
					break;
				case 'Home':
					next = 0;
					break;
				case 'End':
					next = maxIndex;
					break;
				default:
					return;
			}

			e.preventDefault();
			goToIndex(next, 'button');
		};

		el.addEventListener('keydown', onKeyDown);
		return () => el.removeEventListener('keydown', onKeyDown);
	}, []);

	return null;
}
