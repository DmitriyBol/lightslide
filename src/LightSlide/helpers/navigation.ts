/**
 * What triggered a navigation — controls which extra analytics events fire.
 * 'api' is the external surface: the controlled `index` prop and the ref handle.
 * 'settle' is a free-drag coast coming to rest: the index commits (state, analytics,
 * pagination) but the track is NOT snapped — it stays where the momentum stopped.
 */
export type NavigateSource =
	| 'drag'
	| 'button'
	| 'pagination'
	| 'auto'
	| 'api'
	| 'settle';

/** The visual direction the track moved — a loop wrap reports the motion, not the index delta. */
export type NavDirection = 'left' | 'right';

/** The single navigation function shared between LightSlide and its gesture/plugin hooks. */
export type NavigateFn = (nextIndex: number, source: NavigateSource) => void;

/**
 * The per-navigation hook the analytics plugin assigns to `store.emitNav`: flat arguments
 * (the plugin builds the event objects), called by navigateToIndex after every committed
 * position change. A loop wrap is recoverable from the arguments alone — the direction
 * contradicts the index delta (`right` with `to <= from`, or `left` with `to >= from`).
 */
export type EmitNav = (
	from: number,
	to: number,
	direction: NavDirection,
	source: NavigateSource,
) => void;
