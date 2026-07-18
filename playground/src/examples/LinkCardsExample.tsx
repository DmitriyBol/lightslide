import {LightSlide, Slide} from 'lightslide';
import {Navigation} from 'lightslide/navigation';

import {Console} from '../components/Console';
import {Demo, Well} from '../components/Demo';
import {cardTone} from '../components/tones';
import {useConsole} from '../components/useConsole';
import card from './LinkCardsExample.module.scss';

type Product = {
	id: number;
	name: string;
	price: string;
	href: string;
	emoji: string;
};

const PRODUCTS: Product[] = [
	{
		id: 1,
		name: 'Ray-Ban Wayfarer',
		price: '$89',
		href: 'https://example.com/p/1',
		emoji: '🕶️',
	},
	{
		id: 2,
		name: 'Oakley Holbrook',
		price: '$149',
		href: 'https://example.com/p/2',
		emoji: '🥽',
	},
	{
		id: 3,
		name: 'Gucci Oversize',
		price: '$249',
		href: 'https://example.com/p/3',
		emoji: '🕶️',
	},
	{
		id: 4,
		name: 'Prada Linea Rossa',
		price: '$199',
		href: 'https://example.com/p/4',
		emoji: '🥽',
	},
	{
		id: 5,
		name: 'Persol McQueen',
		price: '$189',
		href: 'https://example.com/p/5',
		emoji: '🕶️',
	},
];

function Arrow({dir}: {dir: 'left' | 'right'}) {
	return (
		<svg width="9" height="14" viewBox="0 0 9 14" fill="none" aria-hidden>
			<path
				d={dir === 'left' ? 'M8 1 2 7l6 6' : 'M1 1l6 6-6 6'}
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function LinkCardsExample() {
	const {entries, log, clear} = useConsole();

	return (
		<Demo
			id="link-cards"
			number="20"
			title="Clickable links"
			tag="tap vs drag"
			description={
				<>
					Each card is a real <code>&lt;a href&gt;</code> wrapping a{' '}
					<code>&lt;button&gt;</code>. <b>Tap</b> activates it; <b>drag</b>{' '}
					scrolls and the link is <i>not</i> triggered on release. Custom nav
					buttons sit centred and are never clipped.
				</>
			}>
			<Well>
				<LightSlide
					slidesPerView={2.5}
					navigation={
						<Navigation
							renderPrev={({onClick, disabled}) => (
								<button
									type="button"
									className={card.nav}
									onClick={onClick}
									disabled={disabled}
									aria-label="Previous slide">
									<Arrow dir="left" />
								</button>
							)}
							renderNext={({onClick, disabled}) => (
								<button
									type="button"
									className={card.nav}
									onClick={onClick}
									disabled={disabled}
									aria-label="Next slide">
									<Arrow dir="right" />
								</button>
							)}
						/>
					}>
					{PRODUCTS.map((p, i) => (
						<Slide key={p.id} data={p} style={{padding: '0 6px'}}>
							<a
								href={p.href}
								className={card.card}
								style={{background: cardTone(i)}}
								onClick={e => {
									e.preventDefault();
									log('link', p.name);
								}}>
								<div className={card.imgArea}>
									<span className={card.emoji}>{p.emoji}</span>
								</div>
								<div className={card.info}>
									<span className={card.name}>{p.name}</span>
									<span className={card.price}>{p.price}</span>
									<button
										type="button"
										className={card.cartBtn}
										onClick={e => {
											e.preventDefault();
											log('cart', p.name);
										}}>
										Add to cart
									</button>
								</div>
							</a>
						</Slide>
					))}
				</LightSlide>
			</Well>

			<Console
				entries={entries}
				onClear={clear}
				emptyHint="tap a card, then try dragging"
			/>
		</Demo>
	);
}
