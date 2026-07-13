import {FocusGuard} from './FocusGuard';
import {Keyboard} from './Keyboard';
import {LiveRegion} from './LiveRegion';
import {ReducedMotion} from './ReducedMotion';

export type A11yProps = {
	// Arrow-key / Home / End navigation when the carousel has focus (default true).
	keyboard?: boolean;
	// Make off-screen slides inert so keyboard focus can't land on them (default true).
	focusGuard?: boolean;
	// Announce the active slide via a polite live region (default true).
	liveRegion?: boolean;
	// Stop flow / auto-scroll under prefers-reduced-motion (default true).
	respectReducedMotion?: boolean;
	// Custom live-region text; defaults to "Slide {index + 1} of {count}".
	announce?: (index: number, count: number) => string;
};

/**
 * The umbrella accessibility layer — pass it as `<LightSlide a11y={<A11y />}>`. Each behaviour is
 * an independent, toggleable plugin; because they all live in the `lightslide/a11y` entry, none of
 * this reaches consumers who don't import it. The pieces are also exported individually for
 * consumers who want to cherry-pick (e.g. `a11y={<Keyboard />}`).
 */
export function A11y({
	keyboard = true,
	focusGuard = true,
	liveRegion = true,
	respectReducedMotion = true,
	announce,
}: A11yProps) {
	return (
		<>
			{keyboard && <Keyboard />}
			{focusGuard && <FocusGuard />}
			{liveRegion && <LiveRegion announce={announce} />}
			{respectReducedMotion && <ReducedMotion />}
		</>
	);
}
