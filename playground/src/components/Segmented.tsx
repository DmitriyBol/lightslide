import type {CSSProperties, ReactNode} from 'react';

import styles from './Segmented.module.scss';

type Option<T> = {label: ReactNode; value: T};

type SegmentedProps<T extends string | number> = {
	options: Option<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel?: string;
};

// Single hairline track whose active pill physically slides between segments on a spring —
// the most-touched control on the page, so it gets the liveliest motion.
export function Segmented<T extends string | number>({
	options,
	value,
	onChange,
	ariaLabel,
}: SegmentedProps<T>) {
	const count = options.length;
	const activeIndex = Math.max(
		0,
		options.findIndex(o => o.value === value),
	);

	return (
		<div
			className={styles.seg}
			role="group"
			aria-label={ariaLabel}
			style={{'--count': count} as CSSProperties}>
			<span
				className={styles.thumb}
				aria-hidden
				style={{transform: `translateX(${activeIndex * 100}%)`}}
			/>
			{options.map(o => (
				<button
					key={String(o.value)}
					type="button"
					aria-pressed={o.value === value}
					className={styles.segBtn}
					onClick={() => onChange(o.value)}>
					{o.label}
				</button>
			))}
		</div>
	);
}
