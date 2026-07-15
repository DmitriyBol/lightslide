import {Hero} from './components/Hero';
import {Logo} from './components/Logo';
import {Nav} from './components/Nav';
import {PhaseLabel} from './components/PhaseLabel';
import {ScrollProgress} from './components/ScrollProgress';
import {useReveal} from './components/useReveal';
import {useTheme} from './components/useTheme';
import {AccessibilityExample} from './examples/AccessibilityExample';
import {AutoScrollExample} from './examples/AutoScrollExample';
import {BasicExample} from './examples/BasicExample';
import {ControlledExample} from './examples/ControlledExample';
import {CustomStylesExample} from './examples/CustomStylesExample';
import {CustomTimeoutExample} from './examples/CustomTimeoutExample';
import {FlowExample} from './examples/FlowExample';
import {FlowPerfExample} from './examples/FlowPerfExample';
import {LinkCardsExample} from './examples/LinkCardsExample';
import {LoadingExample} from './examples/LoadingExample';
import {LoopExample} from './examples/LoopExample';
import {MinimalExample} from './examples/MinimalExample';
import {NavigationExample} from './examples/NavigationExample';
import {PaginationExample} from './examples/PaginationExample';
import {ProductCardsExample} from './examples/ProductCardsExample';
import {SlidesPerViewExample} from './examples/SlidesPerViewExample';
import styles from './App.module.scss';
import {GITHUB_URL, INSTALL_COMMAND, NPM_URL} from './meta';

export function App() {
	const {theme, toggle} = useTheme();
	useReveal();

	return (
		<>
			<ScrollProgress />
			<Nav theme={theme} onToggle={toggle} />
			<Hero />

			<hr className={styles.rule} />

			<main className={styles.demos}>
				<PhaseLabel label="Basics" />
				<BasicExample />
				<MinimalExample />
				<CustomStylesExample />

				<PhaseLabel label="Navigation" />
				<SlidesPerViewExample />
				<NavigationExample />
				<PaginationExample />
				<ControlledExample />

				<PhaseLabel label="Motion" />
				<AutoScrollExample />
				<LoopExample />
				<FlowExample />
				<FlowPerfExample />

				<PhaseLabel label="Cards & state" />
				<ProductCardsExample />
				<LinkCardsExample />
				<CustomTimeoutExample />
				<LoadingExample />

				<PhaseLabel label="Accessibility" />
				<AccessibilityExample />
			</main>

			<footer className={styles.footer}>
				<div className={styles.footerInner}>
					<a className={styles.footerBrand} href="#top">
						<span className={styles.footerMark}>
							<Logo size={15} />
						</span>
						LightSlide
					</a>
					<code className={styles.footerCmd}>{INSTALL_COMMAND}</code>
					<span className={styles.footerMeta}>MIT · ~5.5&nbsp;kB · zero-dep</span>
					<span className={styles.footerLinks}>
						<a href={GITHUB_URL} target="_blank" rel="noreferrer">
							GitHub
						</a>
						<a href={NPM_URL} target="_blank" rel="noreferrer">
							npm
						</a>
					</span>
				</div>
			</footer>
		</>
	);
}
