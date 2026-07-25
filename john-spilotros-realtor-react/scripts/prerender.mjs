/* Prerender every public route to its own static HTML file in dist/, with
   per-page title/description/canonical/OG baked in. Runs after the client
   and SSR builds (see the build script in package.json). */
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { render, metaForPath, PRERENDER_ROUTES } = await import(
  pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href
);

const template = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const route of PRERENDER_ROUTES) {
  const appHtml = render(route);
  const m = metaForPath(route);
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${esc(m.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${m.url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${esc(m.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${esc(m.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${m.url}$2`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  const out = route === '/'
    ? join(root, 'dist', 'index.html')
    : join(root, 'dist', route.slice(1), 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log('prerendered', route, '->', out.slice(root.length + 1));
}

/* Unknown paths on GitHub Pages fall through to 404.html; ship the app shell
   there so the client router can still take over (e.g. /admin). */
copyFileSync(join(root, 'dist', 'index.html'), join(root, 'dist', '404.html'));
writeFileSync(join(root, 'dist', '.nojekyll'), '');
console.log('wrote 404.html + .nojekyll');
