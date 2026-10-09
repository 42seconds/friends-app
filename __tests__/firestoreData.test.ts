import { normalizeDates, byDate } from '../src/lib/firestoreData';

describe('normalizeDates', () => {
  it('turns Firestore Timestamps into ISO strings', () => {
    const at = new Date('2026-09-16T08:35:49.000Z');
    const out = normalizeDates({ createdAt: { toDate: () => at }, title: 'Gig' });
    expect(out).toEqual({ createdAt: '2026-09-16T08:35:49.000Z', title: 'Gig' });
  });

  it('handles plain {seconds, nanoseconds} objects and one level of nesting', () => {
    const out = normalizeDates({ transfer: { sentAt: { seconds: 0, nanoseconds: 0 }, toName: 'Thabo' } });
    expect(out.transfer).toEqual({ sentAt: '1970-01-01T00:00:00.000Z', toName: 'Thabo' });
  });

  it('leaves strings, numbers and arrays alone', () => {
    const data = { createdAt: '2026-01-01T00:00:00.000Z', price: 150, interests: ['music'] };
    expect(normalizeDates(data)).toEqual(data);
  });
});

describe('byDate', () => {
  it('sorts missing dates first instead of crashing', () => {
    // Array.sort always moves bare undefined to the end, so wrap the dates
    // the way the app does (bookings with an optional createdAt).
    const list = [{ at: '2026-02-01' }, { at: undefined }, { at: '2026-01-01' }];
    expect(list.sort((a, b) => byDate(a.at, b.at)).map((x) => x.at)).toEqual([undefined, '2026-01-01', '2026-02-01']);
  });
});
