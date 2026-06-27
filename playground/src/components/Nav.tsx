import {GITHUB_URL, NPM_URL, VERSION} from '../meta';
import {Logo} from './Logo';
import styles from './Nav.module.scss';
import {ThemeToggle} from './ThemeToggle';
import type {Theme} from './useTheme';

// Sticky translucent top bar: wordmark left, then version + repo/npm links + theme toggle.
export function Nav({theme, onToggle}: {theme: Theme; onToggle: () => void}) {
	return (
		<header className={styles.nav}>
			<a className={styles.brand} href="#top" aria-label="LightSlide">
				<span className={styles.mark}>
					<Logo />
				</span>
				LightSlide
			</a>

			<nav className={styles.right}>
				<span className={`${styles.version} tnum`}>v{VERSION}</span>
				<a
					className={styles.iconLink}
					href={GITHUB_URL}
					target="_blank"
					rel="noreferrer"
					aria-label="GitHub repository">
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="currentColor"
						aria-hidden>
						<path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.9-1.18-.9-1.18-.73-.5.06-.49.06-.49.81.06 1.24.83 1.24.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
					</svg>
				</a>
				<a
					className={styles.iconLink}
					href={NPM_URL}
					target="_blank"
					rel="noreferrer"
					aria-label="npm package">
					<svg
						width="17"
						height="17"
						viewBox="0 0 16 16"
						fill="currentColor"
						aria-hidden>
						<path d="M0 2.5h16v11H8v-8.5H5.5v8.5H0V2.5Z" />
					</svg>
				</a>
				<ThemeToggle theme={theme} onToggle={onToggle} />
			</nav>
		</header>
	);
}
