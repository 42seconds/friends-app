// Gets a web build (dist/) ready for GitHub Pages, where the app lives in
// a sub-folder: https://42seconds.github.io/friends-app/
//
//   WEB_BASE_URL=/friends-app npx expo export --platform web
//   node scripts/prepare-pages.mjs dist /friends-app
//
// Expo already prefixes its own scripts and assets with the sub-folder;
// this does the same for the home-screen files in public/, and adds what
// GitHub Pages needs to open any app link (404.html) and to serve the
// _expo folder (.nojekyll).
import fs from 'node:fs';
import path from 'node:path';

const [dir = 'dist', baseArg = '/friends-app'] = process.argv.slice(2);
const base = '/' + baseArg.replace(/^\/+|\/+$/g, '');

// 1. Links in the page: /manifest.webmanifest → /friends-app/manifest.webmanifest
const indexPath = path.join(dir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/(href|src)="\/(manifest\.webmanifest|apple-touch-icon\.png|icon-\d+\.png)"/g, `$1="${base}/$2"`);
fs.writeFileSync(indexPath, html);

// 2. The install manifest: start the app, and find its icons, in the sub-folder.
const manifestPath = path.join(dir, 'manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  m.start_url = `${base}/`;
  m.scope = `${base}/`;
  m.icons = (m.icons ?? []).map((i) => ({ ...i, src: i.src.startsWith(base) ? i.src : base + i.src }));
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + '\n');
}

// 3. GitHub Pages has no "send every path to index.html" setting; it shows
//    404.html for unknown paths, so make that the app too. Links such as
//    /friends-app/event/abc then open the right screen.
fs.copyFileSync(indexPath, path.join(dir, '404.html'));

// 4. Serve folders starting with "_" (the app's code is in _expo/).
fs.writeFileSync(path.join(dir, '.nojekyll'), '');

// Not used on GitHub Pages.
fs.rmSync(path.join(dir, 'staticwebapp.config.json'), { force: true });

console.log(`Prepared ${dir} for GitHub Pages at ${base}/`);
