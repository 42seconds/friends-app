import { FAQ, SECTIONS, TILES, searchHelp } from '../src/lib/helpContent';

describe('help content', () => {
  it('has a detailed answer set covering every section', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(30);
    for (const s of SECTIONS) expect(FAQ.some((f) => f.topic === s.key)).toBe(true);
  });

  it('finds answers by words inside steps too', () => {
    expect(searchHelp('their reference').length).toBeGreaterThan(0);
    expect(searchHelp('once-off').map((f) => f.q)).toContain('How do I pay by EFT?');
  });

  it('filters by tile', () => {
    const eft = TILES.find((t) => t.key === 'eft')!;
    expect(searchHelp('', eft.topics).every((f) => eft.topics.includes(f.topic))).toBe(true);
  });

  it('returns nothing for nonsense', () => {
    expect(searchHelp('zzqqxx')).toHaveLength(0);
  });
});
