import type {CSSProperties} from 'react';

import {useA11yContext} from '../../a11ySeam';

/**
 * Standard visually-hidden (screen-reader-only) box: present in the a11y tree, invisible on
 * screen. Inlined rather than shipped as a class so the a11y entry pulls in no CSS.
 */
const visuallyHidden: CSSProperties = {
	position: 'absolute',
	width: 1,
	height: 1,
	margin: -1,
	padding: 0,
	border: 0,
	overflow: 'hidden',
	clip: 'rect(0 0 0 0)',
	whiteSpace: 'nowrap',
};

/**
 * Props for the live-region announcer. `announce` overrides the default
 * "Slide {index + 1} of {count}" text.
 */
export type LiveRegionProps = {
	announce?: (index: number, count: number) => string;
};

/**
 * Announces the active slide to a screen reader. `polite` while the carousel is idle so a manual
 * navigation is read out; `off` while flow / auto-scroll runs, so automatic movement never
 * chatters. Initial content is not announced (polite regions only speak on change), which is
 * exactly right — the first slide is already on screen.
 */
export function LiveRegion({announce}: LiveRegionProps) {
	const {currentIndex, slideCount, autoMotion} = useA11yContext();

	const text = announce
		? announce(currentIndex, slideCount)
		: `Slide ${currentIndex + 1} of ${slideCount}`;

	return (
		<div
			aria-live={autoMotion ? 'off' : 'polite'}
			aria-atomic="true"
			style={visuallyHidden}>
			{text}
		</div>
	);
}
