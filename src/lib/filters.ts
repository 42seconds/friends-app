import { Event } from '../types';
import { Filters } from '../store';
import { subBrandFor, SUB_BRANDS } from './subbrands';
import { allIn } from './pricing';
import { parseEventDate } from './dates';

export function minPrice(e: Event) {
  return e.tickets?.length ? allIn(Math.min(...e.tickets.map((t) => t.price))) : 0;
}

export function applyFilters(events: Event[], f: Filters) {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const inDays = (n: number) => now.getTime() + n * 86400000;
  let out = events.filter((e) => {
    const d = parseEventDate(e.date, e.time);
    if (f.when !== 'any' && d) {
      if (f.when === 'tonight' && d.getTime() > endOfDay.getTime()) return false;
      if (f.when === 'week' && d.getTime() > inDays(7)) return false;
      if (f.when === 'weekend') {
        const day = d.getDay();
        if (d.getTime() > inDays(7) || !(day === 5 || day === 6 || day === 0)) return false;
      }
    }
    const p = minPrice(e);
    if (f.freeOnly && p > 0) return false;
    if (f.maxPrice !== null && p > f.maxPrice) return false;
    if (f.brands.length && !f.brands.includes(subBrandFor(e.tag).key)) return false;
    return true;
  });
  if (f.sort === 'price') out = [...out].sort((a, b) => minPrice(a) - minPrice(b));
  return out;
}

export function activeFilterLabels(f: Filters) {
  const labels: string[] = [];
  if (f.when !== 'any') labels.push({ tonight: 'Tonight', weekend: 'This weekend', week: 'Next 7 days' }[f.when]);
  if (f.freeOnly) labels.push('Free only');
  else if (f.maxPrice !== null) labels.push(`Under R${f.maxPrice}`);
  f.brands.forEach((b) => labels.push(SUB_BRANDS.find((x) => x.key === b)!.name));
  return labels;
}

