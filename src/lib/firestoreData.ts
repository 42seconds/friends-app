// Firestore documents written by older app versions or the admin website
// may store dates as Timestamps (or leave them out). The app works with
// ISO strings, so convert any Timestamp-like value (one level deep) here.
function toIso(v: any): any {
  if (v && typeof v === 'object' && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v && typeof v === 'object' && typeof v.seconds === 'number' && typeof v.nanoseconds === 'number') return new Date(v.seconds * 1000).toISOString();
  return v;
}

export function normalizeDates<T extends Record<string, any>>(data: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    const iso = toIso(v);
    if (iso !== v) out[k] = iso;
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, toIso(vv)]));
    } else out[k] = v;
  }
  return out as T;
}

// Safe string compare for optional ISO dates (missing sorts as oldest).
export function byDate(a?: string, b?: string) {
  return (a ?? '').localeCompare(b ?? '');
}
