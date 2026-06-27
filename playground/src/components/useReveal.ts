import {useEffect} from 'react';

// One shared observer reveals every [data-reveal] block the first time it scrolls into view,
// then stops watching it (reveals never replay). Mounted once at the column level. Honours
// reduced-motion by revealing everything immediately.
export function useReveal(): void {
	useEffect(() => {
		const blocks = Array.from(
			document.querySelectorAll<HTMLElement>('[data-reveal]'),
		);

		const reduce = window.matchMedia(
			'(prefers-reduced-motion: reduce)',
		).matches;
		if (reduce || !('IntersectionObserver' in window)) {
			blocks.forEach(el => el.classList.add('is-visible'));
			return;
		}

		const io = new IntersectionObserver(
			(entries, observer) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			},
			{rootMargin: '0px 0px -8% 0px', threshold: 0.08},
		);

		blocks.forEach(el => io.observe(el));
		return () => io.disconnect();
	}, []);
}
