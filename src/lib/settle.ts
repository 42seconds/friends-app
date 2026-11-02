// Resolves with the promise's value, or with `fallback` if it fails or
// takes longer than `ms`. Used at startup so a slow or broken read (a
// damaged cache file, a stuck storage call) can never keep the app on
// the splash screen.
export function settleWithin<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      () => { clearTimeout(t); resolve(fallback); }
    );
  });
}
