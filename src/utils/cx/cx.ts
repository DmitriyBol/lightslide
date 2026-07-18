/**
 * Tiny zero-dependency className combiner. Accepts only what a className can be — a string,
 * or undefined for "no class here" (absent optional props, `cond ? styles.x : undefined`
 * branches). Joins the present values into one string and returns undefined when nothing is
 * left, so the className attribute is omitted rather than rendered as "".
 */
export type ClassValue = string | undefined;

export function cx(...values: ClassValue[]): string | undefined {
	let out = '';
	for (const value of values) {
		if (!value) continue;
		out = out ? `${out} ${value}` : value;
	}
	return out || undefined;
}
