// Tiny zero-dependency className combiner (clsx-style, minimal).
// Joins truthy class values into one string and returns undefined when empty,
// so the className attribute is omitted rather than rendered as "".
export type ClassValue =
	| string
	| number
	| false
	| null
	| undefined
	| ClassValue[];

export function cx(...values: ClassValue[]): string | undefined {
	const out: string[] = [];
	for (const value of values) {
		if (!value) continue;
		if (Array.isArray(value)) {
			const nested = cx(...value);
			if (nested) out.push(nested);
		} else {
			out.push(String(value));
		}
	}
	return out.length ? out.join(' ') : undefined;
}
