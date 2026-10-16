import { readCache, writeCache, shouldKeepSaved } from '../src/lib/offlineCache';

describe('offline cache', () => {
  it('saves and reads back data', async () => {
    writeCache('events', [{ id: 'e1' }]);
    await new Promise((r) => setTimeout(r, 0));
    expect(await readCache('events')).toEqual([{ id: 'e1' }]);
    expect(await readCache('missing')).toBeNull();
  });

  it("keeps saved data when Firestore answers offline with nothing", () => {
    expect(shouldKeepSaved([], true, [{ id: 'e1' }])).toBe(true);
    expect(shouldKeepSaved([], false, [{ id: 'e1' }])).toBe(false); // really empty online
    expect(shouldKeepSaved([{ id: 'e2' }], true, [{ id: 'e1' }])).toBe(false);
    expect(shouldKeepSaved([], true, null)).toBe(false);
  });
});
