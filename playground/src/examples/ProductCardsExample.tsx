import {LightSlide, Slide} from 'lightslide';
import type {AnalyticsConfig} from 'lightslide';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';
import card from './ProductCardsExample.module.scss';

type Product = {
	id: number;
	name: string;
	price: number;
	oldPrice: number;
	emoji: string;
};

const PRODUCTS: Product[] = [
	{
		id: 1,
		name: 'Ray-Ban Wayfarer Classic',
		price: 89,
		oldPrice: 129,
		emoji: '🕶️',
	},
	{
		id: 2,
		name: 'Oakley Holbrook Titanium',
		price: 149,
		oldPrice: 219,
		emoji: '🥽',
	},
	{
		id: 3,
		name: 'Gucci GG0811S Oversize',
		price: 249,
		oldPrice: 390,
		emoji: '🕶️',
	},
	{
		id: 4,
		name: 'Prada Linea Rossa Sport',
		price: 199,
		oldPrice: 310,
		emoji: '🥽',
	},
	{id: 5, name: 'Persol Steve McQueen', price: 189, oldPrice: 280, emoji: '🕶️'},
];

export function ProductCardsExample() {
	const {entries, log, clear} = useConsole();

	const analytics: AnalyticsConfig<Product> = {
		onEvent: e => {
			switch (e.event) {
				case 'carousel_slide':
					return log(
						'slide',
						`${e.fromIndex} → ${e.toIndex} (${e.direction})`,
					);
				case 'carousel_reached_end':
					return log('end', 'last card reached');
				case 'carousel_nav_button':
					return log('nav', `${e.direction} · ${e.fromIndex} → ${e.toIndex}`);
				case 'carousel_pagination_click':
					return log('pagination', `${e.fromIndex} → ${e.toIndex}`);
			}
		},
	};

	return (
		<Demo
			id="product-cards"
			number="11"
			title="Product cards"
			tag="slidesPerView={1.5}"
			description={
				<>
					A real-world layout: <code>slidesPerView=1.5</code> shows one full
					card and a peek of the next, with navigation and pagination wired
					together. The trailing card scrolls fully into view at the end.
				</>
			}>
			<Well>
				<LightSlide<Product>
					analytics={analytics}
					slidesPerView={1.5}
					navigation={{}}
					pagination={{
						dotStyle: {background: 'var(--border-strong)'},
						activeDotStyle: {background: 'var(--accent)'},
					}}>
					{PRODUCTS.map((p, i) => {
						const off = Math.round((1 - p.price / p.oldPrice) * 100);
						return (
							<Slide key={p.id} data={p} style={{padding: '0 6px'}}>
								<div className={card.card} style={{background: cardTone(i)}}>
									<div className={card.imgArea}>
										<span className={card.emoji}>{p.emoji}</span>
										<span className={card.kind}>Eyewear</span>
									</div>
									<div className={card.info}>
										<p className={card.name}>{p.name}</p>
										<div className={card.priceRow}>
											<span className={`${card.priceNew} tnum`}>
												${p.price}
											</span>
											<span className={`${card.priceOld} tnum`}>
												${p.oldPrice}
											</span>
											<span className={`${card.badge} tnum`}>-{off}%</span>
										</div>
									</div>
								</div>
							</Slide>
						);
					})}
				</LightSlide>
			</Well>

			<Console entries={entries} onClear={clear} />
		</Demo>
	);
}
