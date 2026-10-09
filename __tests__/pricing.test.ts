import { allIn, breakdown, rand, fromPrice } from '../src/lib/pricing';

describe('all-in pricing', () => {
  it('adds the 5% service fee and 15% VAT to face value', () => {
    // R150 face -> R7.50 fee -> R23.63 VAT -> R181.13
    expect(breakdown(150)).toEqual({ subtotal: 150, serviceFee: 7.5, vat: 23.63, discount: 0, total: 181.13 });
    expect(allIn(150)).toBe(181.13);
  });

  it('applies a promo discount to face value before fees', () => {
    const b = breakdown(200, 10);
    expect(b.discount).toBe(20);
    expect(b.serviceFee).toBe(9);
    expect(b.total).toBe(217.35);
  });

  it('keeps free events free', () => {
    expect(allIn(0)).toBe(0);
    expect(fromPrice([{ price: 0 }])).toBe('Free');
    expect(fromPrice(undefined)).toBe('Free');
  });

  it('shows the cheapest ticket as the "from" price', () => {
    expect(fromPrice([{ price: 300 }, { price: 150 }])).toBe('R181 all-in');
  });
});

describe('rand', () => {
  it('formats rand with cents', () => {
    expect(rand(181.13)).toBe('R181.13');
    expect(rand(1500)).toBe('R1,500.00');
  });

  it('rounds when short', () => {
    expect(rand(181.13, true)).toBe('R181');
  });

  it('shows R0 instead of crashing on a missing price', () => {
    expect(rand(undefined as unknown as number)).toBe('R0.00');
    expect(rand(NaN)).toBe('R0.00');
  });
});
