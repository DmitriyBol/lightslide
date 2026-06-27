import {cx} from './cx';
import styles from './ThemeToggle.module.scss';
import type {Theme} from './useTheme';

// Sun/moon capsule whose knob springs across on toggle. Sets data-theme on :root via useTheme
// (owned by App); all tokens are custom properties, so the swap is a single class flip.
export function ThemeToggle({
	theme,
	onToggle,
}: {
	theme: Theme;
	onToggle: () => void;
}) {
	const isLight = theme === 'light';
	return (
		<button
			type="button"
			role="switch"
			aria-checked={isLight}
			aria-label="Toggle light theme"
			className={cx(styles.toggle, isLight && styles.light)}
			onClick={onToggle}>
			<span className={styles.icons} aria-hidden>
				<svg className={styles.moon} width="13" height="13" viewBox="0 0 16 16">
					<path
						d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"
						fill="currentColor"
					/>
				</svg>
				<svg className={styles.sun} width="13" height="13" viewBox="0 0 16 16">
					<circle cx="8" cy="8" r="3.2" fill="currentColor" />
					<g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
						<path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
					</g>
				</svg>
			</span>
			<span className={styles.knob} />
		</button>
	);
}
