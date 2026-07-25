import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';
import {Pagination} from 'lightslide/pagination';

import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';

const ITEMS = [
	{label: 'Design', width: 120},
	{label: 'Engineering', width: 210},
	{label: 'Ops', width: 90},
	{label: 'Marketing & Growth', width: 250},
	{label: 'Sales', width: 110},
	{label: 'People Ops', width: 150},
	{label: 'Finance', width: 170},
];

export function AutoWidthExample() {
	return (
		<Demo
			id="auto-width"
			number="4b"
			title="slidesPerView: auto"
			tag={'slidesPerView="auto"'}
			description={
				<>
					Let each slide keep its own <strong>content width</strong> instead of an
					equal fraction of the viewport — tag rows, chips, hero strips, natural
					cards. The carousel measures every slide and snaps to real boundaries;{' '}
					<code>gap</code> and the arrows/dots work exactly as with a numeric{' '}
					<code>slidesPerView</code>.
				</>
			}>
			<Well>
				<LightSlide
					slidesPerView="auto"
					gap={12}
					navigation={<Navigation />}
					pagination={<Pagination />}>
					{ITEMS.map((item, i) => (
						<Slide key={item.label}>
							<div
								className={slides.tile}
								style={{
									height: 120,
									width: item.width,
									background: cardTone(i),
								}}>
								<span className={slides.eyebrow}>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span style={{fontSize: 15, fontWeight: 600}}>{item.label}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>
		</Demo>
	);
}
