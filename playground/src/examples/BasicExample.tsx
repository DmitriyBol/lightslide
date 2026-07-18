import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsEvent} from 'lightslide/analytics';
import {Analytics} from 'lightslide/analytics';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import slides from '../components/slides.module.scss';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';

type Product = {id: number; name: string; category: string; price: string};

const PRODUCTS: Product[] = [
	{id: 1, name: 'Air Runner Pro', category: 'Running', price: '$99'},
	{id: 2, name: 'Urban Step', category: 'Casual', price: '$149'},
	{id: 3, name: 'Trail Blazer X', category: 'Hiking', price: '$199'},
	{id: 4, name: 'Velvet Stride', category: 'Lifestyle', price: '$129'},
];

export function BasicExample() {
	const {entries, log, clear} = useConsole();

	const onEvent = (e: AnalyticsEvent<Product>) => {
		switch (e.event) {
			case 'carousel_in_viewport':
				return log('viewport');
			case 'carousel_slide':
				return log('slide', `${e.fromIndex} → ${e.toIndex} (${e.direction})`);
			case 'carousel_reached_end':
				return log('end', `${e.slides.length} slides seen`);
			case 'carousel_viewed_slides':
				return log(
					'viewed',
					`after ${e.viewedSeconds}s · ${e.slides.length} seen`,
				);
		}
	};

	return (
		<Demo
			id="basic"
			number="01"
			title="Basic usage"
			tag="analytics"
			description={
				<>
					Swipe or drag the cards. All four analytics events are wired to the
					console via one <code>onEvent</code> handler.{' '}
						<code>carousel_reached_end</code> and{' '}
						<code>carousel_viewed_slides</code> are
					mutually exclusive — only one ever fires.
				</>
			}>
			<Well>
				<LightSlide
					analytics={
						<Analytics<Product> onEvent={onEvent} viewedTimeout={30} />
					}>
					{PRODUCTS.map((p, i) => (
						<Slide key={p.id} data={p}>
							<div
								className={slides.tile}
								style={{height: 196, background: cardTone(i)}}>
								<span className={slides.eyebrow}>{p.category}</span>
								<span
									style={{
										fontSize: 22,
										fontWeight: 700,
										letterSpacing: '-0.02em',
									}}>
									{p.name}
								</span>
								<span className={slides.meta}>{p.price}</span>
							</div>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console entries={entries} onClear={clear} />
		</Demo>
	);
}
