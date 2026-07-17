import {useEffect, useState} from 'react';

import {cx} from './cx';
import styles from './SideNav.module.scss';

type SideNavItem = {id: string; number: string; title: string};

type SideNavGroup = {label: string; items: SideNavItem[]};

/**
 * Scrollspy table of contents for the demo column, shown as a fixed left rail on wide
 * viewports. Groups and items are read from the rendered DOM (`data-phase-label` dividers,
 * `data-number` sections and their h2s) rather than a hand-kept registry, so the rail can
 * never drift from the page when demos are added or renumbered. The active link follows the
 * section crossing the upper band of the viewport; the rail itself is only visible while
 * the demo column intersects the screen.
 */
export function SideNav() {
	const [groups, setGroups] = useState<SideNavGroup[]>([]);
	const [activeId, setActiveId] = useState('');
	const [isOnScreen, setIsOnScreen] = useState(false);

	useEffect(() => {
		const main = document.querySelector('main');
		if (!main) return;

		const collected: SideNavGroup[] = [];
		for (const el of Array.from(main.children)) {
			const phase = el.getAttribute('data-phase-label');
			if (phase) {
				collected.push({label: phase, items: []});
				continue;
			}
			const number = el.getAttribute('data-number');
			const title = el.querySelector('h2')?.textContent;
			const group = collected[collected.length - 1];
			if (el.id && number && title && group)
				group.items.push({id: el.id, number, title});
		}
		setGroups(collected);
	}, []);

	useEffect(() => {
		const sections = Array.from(
			document.querySelectorAll<HTMLElement>('main section[data-number]'),
		);
		const spy = new IntersectionObserver(
			entries => {
				for (const entry of entries) {
					if (entry.isIntersecting) setActiveId(entry.target.id);
				}
			},
			{rootMargin: '-15% 0px -75% 0px'},
		);
		sections.forEach(el => spy.observe(el));
		return () => spy.disconnect();
	}, []);

	useEffect(() => {
		const main = document.querySelector('main');
		if (!main) return;

		/**
		 * The bottom margin shrinks the viewport band, so the rail only fades in once the
		 * demo column actually reaches the upper part of the screen — not while the hero
		 * still owns it with the column barely peeking in at the bottom.
		 */
		const io = new IntersectionObserver(
			entries => {
				for (const entry of entries) setIsOnScreen(entry.isIntersecting);
			},
			{rootMargin: '0px 0px -60% 0px'},
		);
		io.observe(main);
		return () => io.disconnect();
	}, []);

	return (
		<nav
			className={cx(styles.rail, isOnScreen && styles.isOnScreen)}
			aria-label="Demo sections">
			{groups.map(group => (
				<div key={group.label} className={styles.group}>
					<div className={styles.groupLabel}>{group.label}</div>
					<ul className={styles.list}>
						{group.items.map(item => (
							<li key={item.id}>
								<a
									className={cx(
										styles.link,
										item.id === activeId && styles.isActive,
									)}
									href={`#${item.id}`}
									aria-current={item.id === activeId ? 'true' : undefined}
									onClick={() => setActiveId(item.id)}>
									<span className={`${styles.num} tnum`}>{item.number}</span>
									{item.title}
								</a>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}
