import { night } from '../theme/night';

export type SubBrandKey = 'music' | 'talk' | 'fun' | 'food';

export interface SubBrand {
  key: SubBrandKey;
  name: string; // "&Music"
  blurb: string;
  color: string;
  deep: string;
  icon: 'musical-notes' | 'chatbubbles' | 'happy' | 'restaurant';
}

export const SUB_BRANDS: SubBrand[] = [
  { key: 'music', name: '&Music', blurb: 'Gigs, DJ sets, late nights', color: night.orange, deep: night.orangeDeep, icon: 'musical-notes' },
  { key: 'talk', name: '&Talk', blurb: 'Panels, book clubs, big ideas', color: night.blue, deep: night.blueDeep, icon: 'chatbubbles' },
  { key: 'fun', name: '&Fun', blurb: 'Games nights, parties, socials', color: night.lime, deep: night.limeDeep, icon: 'happy' },
  { key: 'food', name: '&Food', blurb: 'Markets, pop-ups, long tables', color: night.yellow, deep: night.yellowDeep, icon: 'restaurant' },
];

// Maps an event's free-form tag onto one of the four sub-brands.
export function subBrandFor(tag?: string): SubBrand {
  const t = (tag ?? '').toLowerCase();
  if (/talk|panel|book|conversation|summit/.test(t)) return SUB_BRANDS[1];
  if (/fun|party|game|social|bingo/.test(t)) return SUB_BRANDS[2];
  if (/food|market|eat|pop-?up|bloom/.test(t)) return SUB_BRANDS[3];
  return SUB_BRANDS[0];
}

export function subBrandByKey(key?: string): SubBrand | undefined {
  return SUB_BRANDS.find((b) => b.key === key);
}
