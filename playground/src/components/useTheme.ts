import {useEffect, useState} from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'lightslide-theme';

function readInitialTheme(): Theme {
	if (typeof window === 'undefined') return 'dark';
	const saved = window.localStorage.getItem(STORAGE_KEY);
	if (saved === 'light' || saved === 'dark') return saved;
	return window.matchMedia('(prefers-color-scheme: light)').matches
		? 'light'
		: 'dark';
}

// Owns the active theme, mirrors it onto <html data-theme> (which the tokens key off of),
// and persists the choice. Dark is the confident default; the first visit honours the OS.
export function useTheme(): {theme: Theme; toggle: () => void} {
	const [theme, setTheme] = useState<Theme>(readInitialTheme);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		window.localStorage.setItem(STORAGE_KEY, theme);
	}, [theme]);

	const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

	return {theme, toggle};
}
