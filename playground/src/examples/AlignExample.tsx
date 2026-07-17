import {useState} from 'react';

import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Controls, Demo, Well} from '../components/Demo';
import {Segmented} from '../components/Segmented';
import slides from '../components/slides.module.scss';
import {Toggle} from '../components/Toggle';
import {cardTone} from '../components/tones';

const ITEMS = ['Aurora', 'Basalt', 'Cinder', 'Dune', 'Ember'];

const ALIGN_OPTIONS = [
	{label: 'start', value: 'start' as const},
	{label: 'center', value: 'center' as const},
];

export function AlignExample() {
	const [align, setAlign] = useState<'start' | 'center'>('center');
	const [isLoop, setIsLoop] = useState(true);

	return (
		<Demo
			id="align"
			number="05"
			title="Center align"
			tag={`align="${align}"`}
			description={
				<>
					<code>align=&quot;center&quot;</code> rests the active slide in the
					middle of the viewport with its neighbours peeking symmetrically — the
					hero / stories pattern. Pair it with a fractional{' '}
					<code>slidesPerView</code>. Without <code>isLoop</code> the track
					never scrolls past its edges: the first and last positions rest flush,
					so only looping keeps every slide perfectly centred.
				</>
			}>
			<Controls>
				<Segmented
					ariaLabel="align"
					options={ALIGN_OPTIONS}
					value={align}
					onChange={setAlign}
				/>
				<Toggle
					checked={isLoop}
					onChange={setIsLoop}
					label={`isLoop ${isLoop ? 'on' : 'off'}`}
				/>
			</Controls>

			<Well>
				<LightSlide
					key={`${align}-${isLoop}`}
					align={align}
					isLoop={isLoop}
					slidesPerView={1.6}
					gap={12}
					navigation={<Navigation />}
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
								style={{height: 190, background: cardTone(i)}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span
									style={{
										fontSize: 28,
										fontWeight: 800,
										letterSpacing: '-0.02em',
									}}>
									{label}
								</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>
		</Demo>
	);
}
