import styles from './PhaseLabel.module.scss';

// A mono phase divider hung on the spine (BASICS / NAVIGATION / MOTION / CARDS & STATE),
// grouping the demos below it. Aligns to the same spine grid as Demo's section number.
export function PhaseLabel({label}: {label: string}) {
	return (
		<div className={styles.phase} data-phase-label={label}>
			<span className={styles.tick} aria-hidden />
			<span className={styles.label}>{label}</span>
		</div>
	);
}
