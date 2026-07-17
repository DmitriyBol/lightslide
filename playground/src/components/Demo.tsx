import type {CSSProperties, ReactNode} from 'react';

import styles from './Demo.module.scss';

type DemoProps = {
	id: string;
	number: string;
	title: string;
	tag?: string;
	description: ReactNode;
	children: ReactNode;
};

// One editorial demo block: a mono section number hung on the left spine, an h2 with an
// optional API feature-tag on the right, a muted description, and a single recessed glass
// panel holding the interactive content. Reveals once on scroll.
export function Demo({
	id,
	number,
	title,
	tag,
	description,
	children,
}: DemoProps) {
	return (
		<section
			id={id}
			data-reveal
			data-number={number}
			className={`${styles.block} reveal`}>
			<div className={`${styles.num} tnum`}>{number}</div>
			<div className={styles.body}>
				<div className={styles.head}>
					<h2 className={styles.title}>{title}</h2>
					{tag && <code className={styles.tag}>{tag}</code>}
				</div>
				<p className={styles.desc}>{description}</p>
				<div className={styles.panel}>{children}</div>
			</div>
		</section>
	);
}

// Flush sub-bar of toggles / segmented controls, pinned to the top-right of a panel.
export function Controls({children}: {children: ReactNode}) {
	return <div className={styles.controls}>{children}</div>;
}

// Darker sunken inset that the carousel sits in, so cards read as set into the glass panel.
export function Well({
	children,
	className,
	style,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	return (
		<div
			className={className ? `${styles.well} ${className}` : styles.well}
			style={style}>
			{children}
		</div>
	);
}
