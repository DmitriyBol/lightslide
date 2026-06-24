import {Slide} from '../../Slide/Slide';
import {collectSlideData} from './slideData';

describe('collectSlideData', () => {
	it('extracts the data prop from Slide children, preserving order', () => {
		const children = [
			<Slide key="a" data={{id: 1}}>
				A
			</Slide>,
			<Slide key="b" data={{id: 2}}>
				B
			</Slide>,
		];
		expect(collectSlideData(children)).toEqual([{id: 1}, {id: 2}]);
	});

	it('yields undefined for non-Slide children and missing data', () => {
		const children = [
			<div key="x">x</div>,
			<Slide key="b" data={5}>
				B
			</Slide>,
			<Slide key="c">C</Slide>,
			'plain text',
		];
		expect(collectSlideData(children)).toEqual([
			undefined,
			5,
			undefined,
			undefined,
		]);
	});

	it('returns an empty array for no children', () => {
		expect(collectSlideData([])).toEqual([]);
	});

	it('accepts a typed data prop via the Slide generic', () => {
		type Product = {id: number; name: string};
		const product: Product = {id: 1, name: 'A'};
		// Compiles only if <Slide<T>> is generic over its data type (ts-jest type-checks).
		const children = [
			<Slide<Product> key="a" data={product}>
				A
			</Slide>,
		];
		expect(collectSlideData(children)).toEqual([product]);
	});
});
