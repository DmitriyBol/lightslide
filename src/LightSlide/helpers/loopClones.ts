import {cloneElement, isValidElement} from 'react';

import type {ReactElement, ReactNode} from 'react';

// Per-slide ARIA (WAI-ARIA APG "carousel" pattern): every real slide is a labelled group so a
// screen reader announces "slide, N of M". Injected via cloneElement so it lands on the slide's
// own DOM node (<Slide> spreads it through) — no extra wrapper element, so flex layout is
// untouched. Non-element children (raw text) can't carry attributes and pass through as-is.
const slideAria = (index: number, count: number) => ({
	role: 'group',
	'aria-roledescription': 'slide',
	'aria-label': `${index + 1} of ${count}`,
});

// Loop clones are pixel-duplicates of real slides, so they must be invisible to assistive tech:
// aria-hidden keeps a screen reader from announcing the content twice, and inert removes their
// focusable descendants from the tab order (otherwise Tab would stop on off-screen duplicates).
// `inert=''` — the empty-string form React 18 renders as the boolean attribute's presence.
const cloneAria = {'aria-hidden': true, inert: ''};

function decorate(child: ReactNode, props: Record<string, unknown>): ReactNode {
	return isValidElement(child)
		? cloneElement(child as ReactElement, props)
		: child;
}

// Builds the rendered track children: every real slide decorated with its per-slide ARIA, plus —
// in loop mode — clones of the last `loopOffset` slides prepended and the first `loopOffset`
// appended (marked hidden/inert) so wrap-around looks continuous. With looping off (loopOffset 0)
// it returns just the decorated real slides.
export function buildDisplayChildren(
	childArray: ReactNode[],
	slideCount: number,
	loopOffset: number,
): ReactNode[] {
	const real = childArray.map((child, i) =>
		decorate(child, slideAria(i, slideCount)),
	);

	if (loopOffset <= 0 || slideCount <= 0) return real;

	// Clones are decorated from the raw children (not `real`) so they carry only the hidden/inert
	// markers, not a redundant "N of M" label on an already-hidden node.
	const prependClones = childArray
		.slice(slideCount - loopOffset)
		.map((child, i) => decorate(child, {...cloneAria, key: `__loop_pre_${i}`}));

	const appendClones = childArray
		.slice(0, loopOffset)
		.map((child, i) =>
			decorate(child, {...cloneAria, key: `__loop_post_${i}`}),
		);

	return [...prependClones, ...real, ...appendClones];
}
