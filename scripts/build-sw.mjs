// Adds the offline service worker (sw.js) to a web build.
//
//   npx expo export --platform web
//   node scripts/build-sw.mjs dist
//
// Lists the files the app needs to open without signal (its code, the
// fonts it uses, its images and icons) and writes them into sw.js, with a
// version taken from their contents so phones pick up each new release.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2] ?? 'dist';
const here = path.dirname(fileURLToPath(import.meta.url));

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

// Fonts the app actually uses; the other icon sets and font weights are
// fetched (and then kept) only if a screen ever asks for them.
const FONTS = /(BebasNeue_400Regular|InstrumentSans_(400Regular|500Medium|600SemiBold|700Bold)|JetBrainsMono_(500Medium|700Bold)|Ionicons)\.[0-9a-f]+\.ttf$/;

const files = walk(dir)
  .map((f) => path.relative(dir, f).split(path.sep).join('/'))
  .filter((f) => {
    if (f === 'sw.js' || f === '404.html' || f.startsWith('.') || f === 'metadata.json') return false;
    if (f.endsWith('.map') || f.endsWith('.json')) return false;
    if (!f.includes('/')) return true; // index.html, manifest, icons, favicon
    if (f.startsWith('_expo/')) return true; // the app's code (+ css)
    if (f.startsWith('assets/assets/')) return true; // the app's own images
    return FONTS.test(f);
  })
  .sort();

const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(dir, f)));
const version = hash.digest('hex').slice(0, 12);

const template = fs.readFileSync(path.join(here, 'sw-template.js'), 'utf8');
const sw = template.replace("'__VERSION__'", JSON.stringify(version)).replace('__PRECACHE__', JSON.stringify(files, null, 2));
fs.writeFileSync(path.join(dir, 'sw.js'), sw);

const kb = Math.round(files.reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0) / 1024);
console.log(`sw.js: ${files.length} files (${kb} KB) saved for offline, version ${version}`);
