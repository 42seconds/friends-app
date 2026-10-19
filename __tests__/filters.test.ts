import { applyFilters, activeFilterLabels, minPrice } from '../src/lib/filters';
import { subBrandFor } from '../src/lib/subbrands';
import { DEFAULT_FILTERS, Filters } from '../src/store';
import { Event } from '../src/types';

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toDateString();

const event = (id: string, tag: string, price: number, date: string): Event =>
  ({ id, title: id, tag, date, time: '', location: 'Braam', status: 'published', tickets: [{ tier: 'GA', price, available: true }] }) as unknown as Event;

const events = [
  event('gig', 'Live Music', 150, inDays(1)),
  event('panel', 'Talk', 0, inDays(3)),
  event('market', 'Food Market', 80, inDays(20)),
];

const f = (over: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...over });

describe('sub-brands', () => {
  it('maps free-form tags onto the four sub-brands', () => {
    expect(subBrandFor('Live Music').key).toBe('music');
    expect(subBrandFor('Book club').key).toBe('talk');
    expect(subBrandFor('Games night').key).toBe('fun');
    expect(subBrandFor('Pop-up market').key).toBe('food');
    expect(subBrandFor(undefined).key).toBe('music');
  });
});

describe('explore filters', () => {
  it('shows everything by default', () => {
    expect(applyFilters(events, DEFAULT_FILTERS)).toHaveLength(3);
  });

  it('filters free events', () => {
    expect(applyFilters(events, f({ freeOnly: true })).map((e) => e.id)).toEqual(['panel']);
  });

  it('caps by all-in price, not face value', () => {
    expect(minPrice(events[0])).toBe(181.13);
    expect(applyFilters(events, f({ maxPrice: 150 })).map((e) => e.id)).toEqual(['panel', 'market']);
  });

  it('filters by sub-brand', () => {
    expect(applyFilters(events, f({ brands: ['food'] })).map((e) => e.id)).toEqual(['market']);
  });

  it('limits to the next 7 days', () => {
    expect(applyFilters(events, f({ when: 'week' })).map((e) => e.id)).toEqual(['gig', 'panel']);
  });

  it('sorts by price', () => {
    expect(applyFilters(events, f({ sort: 'price' })).map((e) => e.id)).toEqual(['panel', 'market', 'gig']);
  });

  it('describes the active filters', () => {
    expect(activeFilterLabels(f({ when: 'weekend', maxPrice: 200, brands: ['talk'] }))).toEqual(['This weekend', 'Under R200', '&Talk']);
  });
});
