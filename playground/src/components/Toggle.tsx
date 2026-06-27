import type {ReactNode} from 'react';

import {cx} from './cx';
import styles from './Toggle.module.scss';

type ToggleProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label?: ReactNode;
	ariaLabel?: string;
};

// A 36×20 track switch — off is a hairline surface, on is a solid accent. Used for play/pause
// and on/off knobs. The knob slides on a spring.
export function Toggle({checked, onChange, label, ariaLabel}: ToggleProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={ariaLabel}
			className={cx(styles.toggle, checked && styles.on)}
			onClick={() => onChange(!checked)}>
			<span className={styles.track}>
				<span className={styles.knob} />
			</span>
			{label && <span className={styles.label}>{label}</span>}
		</button>
	);
}
