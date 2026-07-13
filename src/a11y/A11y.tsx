import {LiveRegion} from './LiveRegion';

export type A11yProps = {
	// Announce the active slide via a polite live region (default true).
	liveRegion?: boolean;
	// Custom live-region text; defaults to "Slide {index + 1} of {count}".
	announce?: (index: number, count: number) => string;
};

/**
 * The umbrella accessibility layer — pass it as `<LightSlide a11y={<A11y />}>`. Bundles the opt-in
 * behaviours behind individual toggles; because it lives in the `lightslide/a11y` entry, none of
 * this code reaches consumers who don't import it. Each behaviour is also exported on its own for
 * consumers who want to cherry-pick.
 */
export function A11y({liveRegion = true, announce}: A11yProps) {
	return <>{liveRegion && <LiveRegion announce={announce} />}</>;
}
