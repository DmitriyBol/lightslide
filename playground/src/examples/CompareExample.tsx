import {Demo} from '../components/Demo';
import styles from './CompareExample.module.scss';

/**
 * One cell of the comparison table. `isPositive` renders it in the standing-out tone —
 * reserved for genuine capabilities, so the table stays honest at a glance.
 */
type CompareCell = {
	label: string;
	isPositive?: boolean;
};

type CompareRow = {
	name: string;
	url?: string;
	isOurs?: boolean;
	cells: CompareCell[];
};

const HEADERS = [
	'Library',
	'min+gzip',
	'A11y out of the box',
	'Arrows & dots',
	'Analytics',
	'Generic data',
	'Last release',
];

const ROWS: CompareRow[] = [
	{
		name: 'lightslide',
		isOurs: true,
		cells: [
			{label: '5.3 kB core', isPositive: true},
			{label: 'APG always on · +1 kB opt-in layer', isPositive: true},
			{label: '✓ tree-shakeable', isPositive: true},
			{label: '✓ typed events', isPositive: true},
			{label: '✓', isPositive: true},
			{label: 'active', isPositive: true},
		],
	},
	{
		name: 'embla-carousel-react',
		url: 'https://www.embla-carousel.com',
		cells: [
			{label: '7.3 kB'},
			{label: 'headless — BYO ARIA'},
			{label: '—'},
			{label: '—'},
			{label: '—'},
			{label: 'active · Apr 2026', isPositive: true},
		],
	},
	{
		name: 'keen-slider',
		url: 'https://keen-slider.io',
		cells: [
			{label: '5.9 kB'},
			{label: '—'},
			{label: '—'},
			{label: '—'},
			{label: '—'},
			{label: 'Jul 2023'},
		],
	},
	{
		name: 'swiper',
		url: 'https://swiperjs.com',
		cells: [
			{label: '19.6 kB'},
			{label: '✓ a11y module', isPositive: true},
			{label: '✓', isPositive: true},
			{label: '—'},
			{label: '—'},
			{label: 'active · Jul 2026', isPositive: true},
		],
	},
	{
		name: '@splidejs/react-splide',
		url: 'https://splidejs.com',
		cells: [
			{label: '13.7 kB'},
			{label: '✓ ARIA built in', isPositive: true},
			{label: '✓', isPositive: true},
			{label: '—'},
			{label: '—'},
			{label: 'Sep 2022'},
		],
	},
	{
		name: 'react-slick',
		url: 'https://react-slick.neostack.com',
		cells: [
			{label: '15.4 kB'},
			{label: 'known gaps'},
			{label: '✓', isPositive: true},
			{label: '—'},
			{label: '—'},
			{label: 'Aug 2025'},
		],
	},
];

/**
 * The honest comparison vs the popular React carousels. Sizes are Bundlephobia min+gzip
 * (July 2026, each package with its own dependencies; lightslide measured identically from
 * its ESM build) — the methodology lives in the block description so the table itself stays
 * scannable.
 */
export function CompareExample() {
	return (
		<Demo
			id="compare"
			number="18"
			title="How it compares"
			tag="honest numbers"
			description={
				<>
					Sizes are min+gzip via Bundlephobia (July 2026); lightslide's core is
					measured the same way from its ESM build, and each opt-in module adds
					0.9–1.5 kB. To be fair: Embla is headless on purpose (and shadcn/ui's
					default) — pick it to own every byte of markup; Swiper's size buys the
					biggest feature set. lightslide's lane is the intersection — small,
					maintained, accessible and complete out of the box.
				</>
			}>
			<div className={styles.scroll}>
				<table className={styles.table}>
					<thead>
						<tr>
							{HEADERS.map(header => (
								<th key={header} scope="col">
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{ROWS.map(row => (
							<tr
								key={row.name}
								className={row.isOurs ? styles.ours : undefined}>
								<th scope="row" className={styles.name}>
									{row.url ? (
										<a href={row.url} target="_blank" rel="noreferrer">
											{row.name}
										</a>
									) : (
										row.name
									)}
								</th>
								{row.cells.map((cell, i) => (
									<td
										key={HEADERS[i + 1]}
										className={
											cell.isPositive ? styles.pos : undefined
										}>
										<span className="tnum">{cell.label}</span>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Demo>
	);
}
