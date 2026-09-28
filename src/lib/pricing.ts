import { SERVICE_FEE_RATE, VAT_RATE } from '../config/pricing';

const round2 = (n: number) => Math.round(n * 100) / 100;

// Per-ticket all-in price for a face value.
export function allIn(face: number): number {
  return breakdown(face).total;
}

export interface PriceBreakdown {
  subtotal: number;
  serviceFee: number;
  vat: number;
  discount: number;
  total: number;
}

// Breakdown for a face-value subtotal, optionally with a % discount
// applied to face value (promo codes).
export function breakdown(faceSubtotal: number, percentOff = 0): PriceBreakdown {
  const discount = round2(faceSubtotal * (percentOff / 100));
  const face = faceSubtotal - discount;
  const serviceFee = round2(face * SERVICE_FEE_RATE);
  const vat = round2((face + serviceFee) * VAT_RATE);
  return {
    subtotal: round2(faceSubtotal),
    serviceFee,
    vat,
    discount,
    total: round2(face + serviceFee + vat),
  };
}

// "R1,234.50" — or "R181" when `short` is set (used on cards).
export function rand(amount: number, short = false): string {
  if (short) return `R${Math.round(amount).toLocaleString('en-ZA').replace(/ /g, ',')}`;
  const [whole, cents] = amount.toFixed(2).split('.');
  return `R${Number(whole).toLocaleString('en-ZA').replace(/ /g, ',')}.${cents}`;
}

export function fromPrice(tickets: { price: number }[] | undefined): string {
  if (!tickets?.length) return 'Free';
  const min = Math.min(...tickets.map((t) => t.price));
  return min === 0 ? 'Free' : `${rand(allIn(min), true)} all-in`;
}
