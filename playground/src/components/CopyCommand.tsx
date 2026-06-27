import {useState} from 'react';

import {cx} from './cx';
import styles from './CopyCommand.module.scss';

// The hero's copyable install pill: a mono command with a `$` prompt in accent and a copy
// button that flips clipboard → check (and briefly flashes) on click. A real interaction,
// not a static string.
export function CopyCommand({command}: {command: string}) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(command);
		} catch {
			// Clipboard can be blocked (insecure context) — still give the visual confirm.
		}
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	};

	return (
		<div className={cx(styles.cmd, copied && styles.copied)}>
			<span className={styles.prompt}>$</span>
			<span className={styles.text}>{command}</span>
			<button
				type="button"
				className={styles.copy}
				onClick={copy}
				aria-label={copied ? 'Copied' : 'Copy install command'}>
				{copied ? (
					<svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						aria-hidden>
						<path
							d="M13.5 4.5 6.5 11.5 3 8"
							stroke="currentColor"
							strokeWidth="1.6"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				) : (
					<svg
						width="15"
						height="15"
						viewBox="0 0 16 16"
						fill="none"
						aria-hidden>
						<rect
							x="5.25"
							y="5.25"
							width="8.5"
							height="8.5"
							rx="2"
							stroke="currentColor"
							strokeWidth="1.5"
						/>
						<path
							d="M3.25 10.5A1.75 1.75 0 0 1 2.25 9V4A1.75 1.75 0 0 1 4 2.25h5a1.75 1.75 0 0 1 1.5 1"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
				)}
			</button>
		</div>
	);
}
