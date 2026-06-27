import {CATEGORY} from './consoleMeta';
import type {ConsoleEntry} from './consoleMeta';
import styles from './Console.module.scss';

type ConsoleProps = {
	entries: ConsoleEntry[];
	onClear?: () => void;
	emptyHint?: string;
};

// Older rows decay toward (but never past) a faint floor so the latest event stays legible.
function rowOpacity(index: number): number {
	return index === 0 ? 1 : Math.max(0.32, 1 - index * 0.13);
}

// A recessed terminal "well": faux titlebar with hairline traffic dots, a live event count, a
// clear action, then category-coloured event tokens that land newest-first. Replaces the
// duplicated event-log <div> every example used to hand-roll.
export function Console({entries, onClear, emptyHint}: ConsoleProps) {
	return (
		<div className={styles.console}>
			<div className={styles.bar}>
				<span className={styles.dots} aria-hidden>
					<i />
					<i />
					<i />
				</span>
				<span className={styles.label}>events</span>
				<span className={`${styles.count} tnum`}>{entries.length}</span>
				{onClear && (
					<button type="button" className={styles.clear} onClick={onClear}>
						clear
					</button>
				)}
			</div>

			<div className={styles.feed}>
				{entries.length === 0 ? (
					<span className={styles.empty}>
						{emptyHint ?? 'waiting for events'}
						<span className={styles.caret} />
					</span>
				) : (
					entries.map((e, i) => {
						const meta = CATEGORY[e.category];
						return (
							<div
								key={e.id}
								className={styles.row}
								style={{opacity: rowOpacity(i)}}>
								<span className={`${styles.time} tnum`}>{e.time}</span>
								<span className={styles.glyph} style={{color: meta.color}}>
									{meta.glyph}
								</span>
								<span className={styles.token} style={{color: meta.color}}>
									{meta.token}
								</span>
								<span className={styles.payload}>{e.payload}</span>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
