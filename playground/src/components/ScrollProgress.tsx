import {useEffect, useRef} from 'react';

import styles from './ScrollProgress.module.scss';

// A 2px gradient bar pinned to the very top edge, filling as the page scrolls. Scales a
// transform (never width) and reads layout in a rAF so the scroll handler stays cheap.
export function ScrollProgress() {
	const barRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let raf = 0;
		const update = () => {
			raf = 0;
			const doc = document.documentElement;
			const max = doc.scrollHeight - doc.clientHeight;
			const ratio = max > 0 ? doc.scrollTop / max : 0;
			if (barRef.current)
				barRef.current.style.transform = `scaleX(${Math.min(1, ratio)})`;
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onScroll, {passive: true});
		window.addEventListener('resize', onScroll, {passive: true});
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	return <div ref={barRef} className={styles.bar} aria-hidden />;
}
