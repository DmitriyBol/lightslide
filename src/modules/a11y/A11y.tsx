import {FocusGuard} from './FocusGuard';
import {Keyboard} from './Keyboard';
import {LiveRegion} from './LiveRegion';
import {ReducedMotion} from './ReducedMotion';

/**
 * Per-behaviour toggles for the bundled a11y plugins (all default true), plus a custom live-region
 * formatter. keyboard: arrow / Home / End nav; focusGuard: inert off-screen slides; liveRegion:
 * polite "Slide N of M" announcements; respectReducedMotion: stop flow / auto-scroll under
 * prefers-reduced-motion; announce: overrides the live-region text.
 */
export type A11yProps = {
	keyboard?: boolean;
	focusGuard?: boolean;
	liveRegion?: boolean;
	respectReducedMotion?: boolean;
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
