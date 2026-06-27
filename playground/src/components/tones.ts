// Maps a slide index onto the theme-aware tonal-staircase card variable, so a row of demo
// cards always steps through the same neutral tones (and follows the active theme).
export function cardTone(index: number): string {
	return `var(--card-${(index % 5) + 1})`;
}
