import {LightSlide, Slide} from 'lightslide';
import {Flow} from 'lightslide/flow';

import {GITHUB_URL, INSTALL_COMMAND} from '../meta';
import {CopyCommand} from './CopyCommand';
import styles from './Hero.module.scss';
import {Pill} from './Pill';

const FEATURES = ['drag', 'loop', 'flow', 'slidesPerView', 'analytics'];

const FLOW_ITEMS = [
	'drag',
	'loop',
	'flow',
	'slidesPerView',
	'pagination',
	'navigation',
	'autoScroll',
	'analytics',
	'loading',
	'zero-deps',
];

// The hero: an editorial headline, a real copyable install pill, feature pills, and — the
// "wow" — a live <LightSlide> drifting in flow mode, rendered grayscale and masked into the
// background so the library is running before a word of docs.
export function Hero() {
	return (
		<section id="top" className={styles.hero}>
			<div className={styles.orb} aria-hidden />

			<div className={styles.inner}>
				<p className={styles.eyebrow}>
					<span className={styles.dot} />
					ZERO-DEP · ~5 KB CORE · ACCESSIBLE BY DEFAULT
				</p>

				<h1 className={styles.headline}>
					The <span className={styles.grad}>carousel</span> that gets out of
					your way.
				</h1>

				<p className={styles.lede}>
					A tiny, fully-typed React slider — accessible by default, batteries
					included. Drag, loop, flow, paginate — no dependencies, no styling
					opinions, ~5&nbsp;kB core — arrows, dots, autoplay, flow, analytics,
					breakpoints and a11y ship as tree-shakeable modules.
				</p>

				<div className={styles.actions}>
					<CopyCommand command={INSTALL_COMMAND} />
					<a
						className={styles.ghost}
						href={GITHUB_URL}
						target="_blank"
						rel="noreferrer">
						GitHub <span aria-hidden>→</span>
					</a>
				</div>

				<div className={styles.pills}>
					{FEATURES.map(f => (
						<Pill key={f}>{f}</Pill>
					))}
				</div>
			</div>

			<div className={styles.flowWrap} aria-hidden>
				<LightSlide slidesPerView={4.5} flow={<Flow speed={26} />}>
					{FLOW_ITEMS.map(label => (
						<Slide key={label}>
							<div className={styles.chip}>
								<span className={styles.chipDot} />
								{label}
							</div>
						</Slide>
					))}
				</LightSlide>
			</div>
		</section>
	);
}
