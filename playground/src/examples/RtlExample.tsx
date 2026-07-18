import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsEvent} from 'lightslide/analytics';
import {Analytics} from 'lightslide/analytics';
import {FreeScroll} from 'lightslide/free';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Console} from '../components/Console';
import {Controls, Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

const ITEMS = [
	{label: 'Slide 1', sub: 'أول'},
	{label: 'Slide 2', sub: 'ثان'},
	{label: 'Slide 3', sub: 'ثالث'},
	{label: 'Slide 4', sub: 'رابع'},
	{label: 'Slide 5', sub: 'خامس'},
];

export function RtlExample() {
	const [isRtl, setIsRtl] = useState(true);
	const [isFree, setIsFree] = useState(false);
	const {entries, log, clear} = useConsole();

	const onEvent = (e: AnalyticsEvent) => {
		if (e.event === 'carousel_slide')
			log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
	};

	return (
		<Demo
			id="rtl"
			number="17"
			title="Right-to-left"
			tag='dir="rtl"'
			description={
				<>
					<code>dir="rtl"</code> mirrors the whole carousel: slides advance
					right-to-left, drag/wheel/keyboard follow the visual direction, the
					arrows swap sides, and the loop wraps the other way. The analytics{' '}
					<code>direction</code> stays the visual truth — forward is{' '}
					<code>left</code> here. Every gesture mode mirrors the same way — flip
					on free momentum and the coast (and its wrap through the loop seam)
					runs mirrored too.
				</>
			}>
			<Controls>
				<Toggle
					checked={isRtl}
					onChange={v => {
						setIsRtl(v);
						clear();
					}}
					label={`dir ${isRtl ? 'rtl' : 'ltr'}`}
				/>
				<Toggle
					checked={isFree}
					onChange={v => {
						setIsFree(v);
						clear();
					}}
					label={`free momentum ${isFree ? 'on' : 'off'}`}
				/>
			</Controls>

			<Well>
				<LightSlide
					key={String(isRtl)}
					dir={isRtl ? 'rtl' : 'ltr'}
					isLoop
					free={isFree ? <FreeScroll /> : undefined}
					analytics={<Analytics onEvent={onEvent} />}
					navigation={<Navigation />}
					pagination={
						<Pagination
							dotStyle={{background: 'var(--border-strong)'}}
							activeDotStyle={{background: 'var(--accent)'}}
						/>
					}>
					{ITEMS.map((item, i) => (
						<Slide key={item.label}>
							<div
								className={slides.tile}
								style={{height: 190, background: cardTone(i)}}>
								<span className={slides.eyebrow}>{item.sub}</span>
								<span
									style={{
										fontSize: 28,
										fontWeight: 800,
										letterSpacing: '-0.02em',
									}}>
									{item.label}
								</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console entries={entries} onClear={clear} />
		</Demo>
	);
}
