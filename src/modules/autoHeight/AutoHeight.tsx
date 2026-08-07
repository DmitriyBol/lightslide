import {useAutoHeightSeam} from '../../seams/autoHeightSeam';
import {useNavContext} from '../../seams/lightSlideContext';
import {useAutoHeight} from './useAutoHeight';

/**
 * Opt-in adaptive viewport height — pass `autoHeight={<AutoHeight />}`. Renders nothing: it
 * sizes the clipping viewport to the active slide's measured height and animates the change
 * in step with the snap (same duration and easing), instead of the default box that stays as
 * tall as the tallest slide. Applies to every navigation source — drag, buttons, pagination,
 * autoplay, the external API, a free-scroll settle — and re-measures when the active slide's
 * content resizes or the viewport reflows. Inert while `flow` runs (continuous motion has no
 * active slide) and on a vertical carousel (`axis="y"` — there the viewport height is the
 * layout input); reduced motion applies each height instantly. Bundles that never import
 * `lightslide/autoheight` pay nothing for it.
 */
export function AutoHeight() {
	const {viewportRef, trackRef, storeRef, active} = useAutoHeightSeam();
	/** The committed navigation signal the height effect re-runs on — same seam as the controls. */
	const {currentIndex} = useNavContext();

	useAutoHeight({enabled: active, currentIndex, viewportRef, trackRef, storeRef});

	return null;
}
