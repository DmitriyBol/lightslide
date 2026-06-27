import {useCallback, useRef, useState} from 'react';

import type {ConsoleCategory, ConsoleEntry} from './consoleMeta';

// Backs the terminal <Console>: keeps the newest `max` events (newest first), stamps each with
// a wall-clock time, and hands back `log(category, payload)` / `clear`. The glyph + colour for
// a category are resolved at render time from consoleMeta, so callers only pick a category.
export function useConsole(max = 12): {
	entries: ConsoleEntry[];
	log: (category: ConsoleCategory, payload?: string) => void;
	clear: () => void;
} {
	const [entries, setEntries] = useState<ConsoleEntry[]>([]);
	const nextId = useRef(0);

	const log = useCallback(
		(category: ConsoleCategory, payload = '') => {
			const time = new Date().toLocaleTimeString('en-GB');
			setEntries(prev =>
				[{id: nextId.current++, time, category, payload}, ...prev].slice(
					0,
					max,
				),
			);
		},
		[max],
	);

	const clear = useCallback(() => setEntries([]), []);

	return {entries, log, clear};
}
