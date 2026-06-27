import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsHandlers} from 'lightslide';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const SEASONS = ['Summer Collection', 'Autumn Drop', 'Winter Line'];
const SHOES = ['Trail Boot', 'Court Low', 'Flip Pro'];

export function CustomStylesExample() {
	const {entries, log, clear} = useConsole();

	const analytics: AnalyticsHandlers = {
		onSlide: p =>
			log('slide', `${p.fromIndex} → ${p.toIndex} (${p.direction})`),
	};

	return (
		<Demo
			id="custom-styles"
			number="03"
			title="Custom styles"
			tag="style · trackStyle"
			description={
				<>
					<code>style</code>/<code>className</code> control the outer container,
					<code>trackStyle</code> the scrollable row, and every{' '}
					<code>Slide</code> takes its own <code>style</code>. The library ships
					no visual opinions.
				</>
			}>
			<Well>
				<LightSlide
					analytics={analytics}
					style={{
						borderRadius: 'var(--radius-md)',
						boxShadow: '0 12px 40px -28px rgba(0,0,0,0.7)',
					}}>
					{SEASONS.map((label, i) => (
						<Slide
							key={label}
							style={{
								position: 'relative',
								height: 180,
								background: cardTone(i + 1),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								userSelect: 'none',
							}}>
							<span
								className={slides.accentBar}
								style={{
									position: 'absolute',
									top: 0,
									left: '50%',
									transform: 'translateX(-50%)',
								}}
							/>
							<span
								style={{
									fontSize: 20,
									fontWeight: 700,
									letterSpacing: '-0.02em',
								}}>
								{label}
							</span>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Well>
				<LightSlide slidesPerView={1.15} trackStyle={{gap: 0}}>
					{SHOES.map((label, i) => (
						<Slide key={label} style={{padding: '0 8px'}}>
							<div
								className={slides.tile}
								style={{height: 130, background: cardTone(i)}}>
								<span className={slides.eyebrow}>Peek</span>
								<span style={{fontSize: 16, fontWeight: 600}}>{label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="swipe to log slide events"
			/>
		</Demo>
	);
}
