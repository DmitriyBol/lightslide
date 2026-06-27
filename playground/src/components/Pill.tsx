import type {ReactNode} from 'react';

import styles from './Pill.module.scss';

// Hairline mono chip — feature tags in the hero, small labels elsewhere.
export function Pill({children}: {children: ReactNode}) {
	return <span className={styles.pill}>{children}</span>;
}
