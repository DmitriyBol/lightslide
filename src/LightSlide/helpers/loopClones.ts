import {cloneElement, isValidElement} from 'react';

import type {CSSProperties, ReactElement, ReactNode} from 'react';

type SlideLabeler = (index: number, count: number) => string;

/**
 * Per-slide ARIA (WAI-ARIA APG "carousel" pattern): every real slide becomes a `group` announced as
 * a slide. Consumer naming wins — when the child already sets `aria-label` or `aria-labelledby`, the
 * automatic "N of M" name (from `slideLabel`) is skipped and the consumer's name is left untouched.
 * Injected via cloneElement so it lands on the slide's own DOM node (<Slide> spreads it through) —
 * no extra wrapper element, so flex layout is untouched. Non-element children (raw text) can't carry
 * attributes and pass through as-is.
 */
function slideAria(
	child: ReactElement,
	index: number,
	count: number,
	slideLabel: SlideLabeler,
): Record<string, unknown> {
	const props = child.props as Record<string, unknown>;
	const named =
		props['aria-label'] != null || props['aria-labelledby'] != null;
	return {
		role: 'group',
		'aria-roledescription': 'slide',
		...(named ? null : {'aria-label': slideLabel(index, count)}),
	};
}

/**
 * Loop clones are pixel-duplicates of real slides, so they must be invisible to assistive tech:
 * aria-hidden keeps a screen reader from announcing the content twice, and inert removes their
 * focusable descendants from the tab order (otherwise Tab would stop on off-screen duplicates).
 * `inert=''` — the empty-string form React 18 renders as the boolean attribute's presence.
 *
 * They also get `pointer-events: none`: the browser never dispatches pointer events for an
 * inert target — not even to its ancestors — so a grab that lands on a clone would silently
 * die and the strip would be undraggable whenever the wrap window parks clones under the
 * cursor (flow spends a whole viewport-width of every cycle there). Skipping the clone in CSS
 * hit-testing instead makes the grab fall through to the viewport, where the gesture handlers
 * live. The consumer's own style is merged in so clones keep the exact geometry of their
 * originals.
 */
function cloneProps(child: ReactNode, key: string): Record<string, unknown> {
	const style = isValidElement(child)
		? (child.props as {style?: CSSProperties}).style
		: undefined;
	return {
		'aria-hidden': true,
		inert: '',
		key,
		style: {...style, pointerEvents: 'none'},
	};
}

function decorate(child: ReactNode, props: Record<string, unknown>): ReactNode {
	return isValidElement(child)
		? cloneElement(child as ReactElement, props)
		: child;
}

/**
 * Builds the rendered track children: every real slide decorated with its per-slide ARIA, plus —
 * in loop mode — clones of the last `loopOffset` slides prepended and the first `loopOffset`
 * appended (marked hidden/inert) so wrap-around looks continuous. With looping off (loopOffset 0)
 * it returns just the decorated real slides.
 */
export function buildDisplayChildren(
	childArray: ReactNode[],
	slideCount: number,
	loopOffset: number,
	slideLabel: SlideLabeler,
): ReactNode[] {
	const real = childArray.map((child, i) =>
		isValidElement(child)
			? cloneElement(
					child as ReactElement,
					slideAria(child as ReactElement, i, slideCount, slideLabel),
				)
			: child,
	);

	if (loopOffset <= 0 || slideCount <= 0) return real;

	/**
	 * Clones are decorated from the raw children (not `real`) so they carry only the hidden/inert
	 * markers, not a redundant "N of M" label on an already-hidden node.
	 */
	const prependClones = childArray
		.slice(slideCount - loopOffset)
		.map((child, i) => decorate(child, cloneProps(child, `__loop_pre_${i}`)));

	const appendClones = childArray
		.slice(0, loopOffset)
		.map((child, i) => decorate(child, cloneProps(child, `__loop_post_${i}`)));

	return [...prependClones, ...real, ...appendClones];
}
