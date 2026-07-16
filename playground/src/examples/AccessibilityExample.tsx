import type {AnalyticsConfig} from 'lightslide';
import {LightSlide, Slide} from 'lightslide';
import {A11y} from 'lightslide/a11y';
import {Flow} from 'lightslide/flow';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';
import type {ReactNode} from 'react';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = [
	'Air Runner Pro',
	'Urban Step',
	'Trail Blazer X',
	'Velvet Stride',
	'Cloud Walker',
];

const MORE = [
	'Aurora Knit',
	'Boreal Boot',
	'Cobalt Dash',
	'Dune Loafer',
	'Ember Flex',
	'Frost Trainer',
];

function Tile({
	label,
	i,
	height = 150,
	link = false,
}: {
	label: string;
	i: number;
	height?: number;
	link?: boolean;
}) {
	return (
		<div className={slides.tile} style={{height, background: cardTone(i)}}>
			{link ? (
				<a
					href="#a11y"
					style={{color: 'inherit', textDecoration: 'none', fontWeight: 600}}>
					{label}
				</a>
			) : (
				<span style={{fontWeight: 600}}>{label}</span>
			)}
		</div>
	);
}

function Row({
	tag,
	note,
	children,
}: {
	tag: string;
	note: string;
	children: ReactNode;
}) {
	return (
		<div style={{marginBottom: 20}}>
			<p style={{margin: '0 0 8px', fontSize: 13, opacity: 0.68}}>
				<code>{tag}</code> — {note}
			</p>
			<Well>{children}</Well>
		</div>
	);
}

export function AccessibilityExample() {
	const {entries, log, clear} = useConsole();

	// One shared console; each carousel prefixes its payload with a source so analytics reads per
	// demo (the category set is fixed — the source lives in the payload).
	const analyticsFor = (source: string): AnalyticsConfig => ({
		onEvent: e => {
			if (e.event === 'carousel_slide')
				log('slide', `${source} · ${e.fromIndex} → ${e.toIndex} (${e.direction})`);
			else if (e.event === 'carousel_reached_end')
				log('end', `${source} · reached end`);
		},
	});

	return (
		<Demo
			id="a11y"
			number="18"
			title="Accessibility layer"
			tag="a11y"
			description={
				<>
					Core ARIA (carousel region, per-slide <code>N of M</code> labels, hidden
					loop clones, linked controls) ships built-in. The opt-in{' '}
					<code>lightslide/a11y</code> layer — <code>{'a11y={<A11y />}'}</code> —
					adds keyboard nav, focus-guarding, live announcements and reduced-motion,
					tree-shaken away unless imported. Below it rides on drag, loop,
					slidesPerView and flow, all logging analytics to one console. Tab into a
					carousel, then use ← / → / Home / End.
				</>
			}>
			<Row
				tag="drag + keyboard"
				note="drag, or Tab to a control and use the arrows; each slide holds a real link that focus-guard hides when off-screen">
				<LightSlide
					label="Product highlights"
					analytics={analyticsFor('drag')}
					navigation={<Navigation />}
					pagination={<Pagination />}
					a11y={<A11y />}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
							<Tile label={label} i={i} height={160} link />
						</Slide>
					))}
				</LightSlide>
			</Row>

			<Row
				tag="loop"
				note="infinite loop — the cloned edge slides are aria-hidden + inert, so a screen reader never reads them twice">
				<LightSlide
					label="Trending — loop"
					analytics={analyticsFor('loop')}
					navigation={<Navigation />}
					isLoop
					a11y={<A11y />}>
					{MORE.map((label, i) => (
						<Slide key={label}>
							<Tile label={label} i={i} />
						</Slide>
					))}
				</LightSlide>
			</Row>

			<Row
				tag="slidesPerView"
				note="three slides at once — focus-guard keeps exactly the visible slides interactive; each Slide carries an aria-label so a screen reader names the card instead of just 'N of M'">
				<LightSlide
					label="Gallery — 3 up"
					slidesPerView={3}
					analytics={analyticsFor('gallery')}
					navigation={<Navigation />}
					pagination={<Pagination />}
					a11y={<A11y />}>
					{MORE.map((label, i) => (
						<Slide
							key={label}
							aria-label={`${label} sneaker`}
							style={{padding: '0 5px'}}>
							<Tile label={label} i={i} height={120} link />
						</Slide>
					))}
				</LightSlide>
			</Row>

			<Row
				tag="flow"
				note="continuous ticker — the live region falls silent during auto-motion, and prefers-reduced-motion stops it">
				<LightSlide
					label="Ticker — flow"
					flow={<Flow speed={45} />}
					a11y={<A11y />}>
					{MORE.map((label, i) => (
						<Slide key={label} style={{padding: '0 5px'}}>
							<Tile label={label} i={i} height={110} />
						</Slide>
					))}
				</LightSlide>
			</Row>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="tab in, then press ← / → …"
			/>
		</Demo>
	);
}
