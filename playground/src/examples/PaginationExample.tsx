import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsEvent} from 'lightslide/analytics';
import {Analytics} from 'lightslide/analytics';
import {Pagination} from 'lightslide/pagination';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = ['Mountains', 'Ocean', 'Sunset', 'Forest', 'Desert'];

export function PaginationExample() {
	const {entries, log, clear} = useConsole();

	const onEvent = (e: AnalyticsEvent) => {
		if (e.event === 'carousel_pagination_click')
			log('pagination', `${e.fromIndex} → ${e.toIndex}`);
		else if (e.event === 'carousel_slide')
			log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
	};

	return (
		<Demo
			id="pagination"
			number="08"
			title="Pagination dots"
			tag="pagination"
			description={
				<>
					Pass <code>pagination</code> to render dots below the track — one per
					scroll position (<code>maxIndex + 1</code>). The active dot tracks
					every navigation type, and <code>dotStyle</code>/
					<code>activeDotStyle</code> restyle them entirely.
				</>
			}>
			<Well>
				<LightSlide
					analytics={<Analytics onEvent={onEvent} />}
					pagination={
						<Pagination
							dotStyle={{background: 'var(--border-strong)'}}
							activeDotStyle={{background: 'var(--accent)'}}
						/>
					}>
					{ITEMS.map((label, i) => (
						<Slide key={label}>
							<div
								className={slides.tile}
								style={{height: 170, background: cardTone(i)}}>
								<span style={{fontSize: 17, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Well>
				<LightSlide
					slidesPerView={2}
					pagination={
						<Pagination
							style={{gap: 8, padding: '14px 0 4px'}}
							dotStyle={{
								width: 10,
								height: 4,
								borderRadius: 2,
								background: 'var(--border-strong)',
							}}
							activeDotStyle={{
								width: 24,
								background: 'var(--accent)',
								transform: 'none',
							}}
						/>
					}>
					{ITEMS.map((label, i) => (
						<Slide key={label} style={{padding: '0 5px'}}>
							<div
								className={slides.tile}
								style={{height: 118, background: cardTone(i)}}>
								<span style={{fontSize: 14, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="click a dot to log…"
			/>
		</Demo>
	);
}
