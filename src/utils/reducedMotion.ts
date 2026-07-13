// True when the user has requested reduced motion (prefers-reduced-motion: reduce).
// Read imperatively at each snap rather than subscribed to — a discrete slide change just
// needs the current preference, not a live re-render on change. SSR-safe: matchMedia is
// undefined on the server (and in jsdom), where we default to "motion allowed"; the client
// re-checks on its first snap.
export function prefersReducedMotion(): boolean {
	return (
		typeof matchMedia === 'function' &&
		matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}
