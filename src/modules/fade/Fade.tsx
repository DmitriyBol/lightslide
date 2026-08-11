import {useState} from 'react';

import {SNAP_DURATION_MS, SNAP_EASING} from '../../LightSlide/helpers/constants';
import {useFadeSeam} from '../../seams/fadeSeam';
import {useNavContext} from '../../seams/lightSlideContext';
import {useFade} from './useFade';

/**
 * The fade entry's critical CSS, served with the markup like the core's SSR style so the
 * server paint is already the stacked layout (zero CLS, LIG-11). One grid cell stacks every
 * child; `transform`/`transition: none !important` retires the track motion without touching
 * the core — the snap keeps writing its inline transform, the stylesheet just outranks it,
 * so unmounting the plugin restores the translated track mid-session at the correct
 * position. Children crossfade through the snap's own duration/easing (instant under
 * reduced motion), and the `:not(:nth-child())` rule pins initial visibility to the start
 * slide — it stays frozen and goes inert once the per-slide inline styles land on hydration
 * (loop clones, never active, simply stay under it forever). The string lands in the DOM
 * via dangerouslySetInnerHTML: `slidesId` is library-generated (useId) and the child
 * position is arithmetic on internal numbers, so nothing consumer-controlled can reach it.
 */
function buildFadeCss(slidesId: string, startNth: number): string {
	const track = `[id="${slidesId}"]`;
	const nth = Number.isFinite(startNth) && startNth > 0 ? startNth : 1;
	return (
		`${track}{display:grid;transform:none!important;transition:none!important}` +
		`${track}>*{grid-area:1/1;transition:opacity ${SNAP_DURATION_MS}ms ${SNAP_EASING}}` +
		`${track}>:not(:nth-child(${nth})){opacity:0;pointer-events:none}` +
		`@media (prefers-reduced-motion:reduce){${track}>*{transition:none}}`
	);
}

/**
 * Opt-in crossfade effect — pass `fade={<Fade />}`. Slides stack in one place and the
 * active one fades in over the outgoing one instead of the track sliding sideways: the
 * classic hero-banner / image-gallery transition. Every navigation source keeps working —
 * drag becomes "swipe to change" (the gesture math still decides next/prev; there is just
 * no dragging motion to see), buttons, pagination, autoplay, keyboard, the external API —
 * and `loop` reduces to index wrapping (the clones stay hidden in the stack). Inactive
 * slides are pointer-inert, `aria-hidden`, and `inert`, so only the visible slide is
 * clickable, readable, or focusable. Reduced motion swaps instantly. Needs
 * `slidesPerView` 1 (the stack shows one slide by definition); suspended while `flow`
 * runs. Bundles that never import `lightslide/fade` pay nothing for it.
 */
export function Fade() {
	const {trackRef, storeRef, active} = useFadeSeam();
	/** The committed navigation signal the fade re-runs on — same seam as the controls. */
	const {currentIndex, maxIndex, isLoop, slidesId} = useNavContext();

	/**
	 * Frozen at first render: the server text and the first client render must agree for
	 * hydration, and after mount the per-slide inline styles own visibility.
	 */
	const [css] = useState(() =>
		buildFadeCss(slidesId, storeRef.current.loopOffset + currentIndex + 1),
	);

	useFade({enabled: active, currentIndex, maxIndex, isLoop, trackRef, storeRef});

	return active ? <style dangerouslySetInnerHTML={{__html: css}} /> : null;
}
