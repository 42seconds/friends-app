/* &friends service worker: lets the installed web app open without signal.
 *
 * Generated into the web build by scripts/build-sw.mjs (which fills in
 * VERSION and PRECACHE). Paths are relative to wherever the app lives, so
 * the same file works on Firebase Hosting (/) and GitHub Pages
 * (/friends-app/).
 *
 * - The app's code, fonts and images are downloaded on the first visit.
 * - Opening the app: tries the network first (to get updates), and falls
 *   back to the saved copy when there's no signal or it's too slow.
 * - Event pictures are saved as they're seen, so they show offline too.
 * - Database and login traffic (Firebase) is never touched; the app keeps
 *   its own saved copy of events, tickets and the profile.
 */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;

const SHELL = `andfriends-shell-${VERSION}`;
const RUNTIME = 'andfriends-runtime';
const IMAGES = 'andfriends-images';
const MAX_IMAGES = 150;
const NAV_TIMEOUT_MS = 8000; // slow mobile data: wait for the newest version before using the saved one

const scope = self.registration.scope; // e.g. https://x.github.io/friends-app/
const abs = (p) => new URL(p, scope).href;
const APP_PAGE = abs('index.html');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE.map(abs)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Keep this version and the one before it (a screen still open from
      // the old version may need its files), delete older ones.
      const shells = (await caches.keys()).filter((k) => k.startsWith('andfriends-shell-') && k !== SHELL);
      await Promise.all(shells.slice(0, -1).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function openApp(request) {
  try {
    const res = await Promise.race([fetch(request), timeout(NAV_TIMEOUT_MS)]);
    // GitHub Pages answers app links (e.g. /event/abc) with the app page
    // and a 404 status; that's still the app, so use it.
    if (res.ok || res.status === 404) return res;
    throw new Error(`status ${res.status}`);
  } catch {
    return (await caches.match(APP_PAGE)) || Response.error();
  }
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    const copy = res.clone();
    caches.open(RUNTIME).then((c) => c.put(request, copy));
  }
  return res;
}

async function trimImages() {
  const c = await caches.open(IMAGES);
  const keys = await c.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGES)).map((k) => c.delete(k)));
}

async function image(request, event) {
  const c = await caches.open(IMAGES);
  const hit = await c.match(request);
  const update = fetch(request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') {
        c.put(request, res.clone()).then(trimImages);
      }
      return res;
    })
    .catch(() => hit || Response.error());
  if (hit) {
    event.waitUntil(update.catch(() => {}));
    return hit;
  }
  return update;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // the app's connection check uses HEAD: never answer it offline
  const url = new URL(request.url);

  if (url.href.startsWith(scope)) {
    if (request.mode === 'navigate') {
      event.respondWith(openApp(request));
    } else {
      event.respondWith(cacheFirst(request));
    }
    return;
  }

  // Event pictures from other sites (Firebase Storage, image hosts).
  if (request.destination === 'image') {
    event.respondWith(image(request, event));
  }
  // Everything else (Firestore, login) goes straight to the network.
});
