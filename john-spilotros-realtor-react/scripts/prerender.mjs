/* Prerender every public route to its own static HTML file in dist/, with
   per-page title/description/canonical/OG baked in. Runs after the client
   and SSR builds (see the build script in package.json). */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { render, metaForPath, PRERENDER_ROUTES } = await import(
  pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href
);

const template = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function pageHtml(route) {
  const appHtml = render(route);
  const m = metaForPath(route);
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>` + (m.noindex ? '\n<meta name="robots" content="noindex">' : ''))
    .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${esc(m.description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${m.url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${esc(m.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${esc(m.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${m.url}$2`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

for (const route of PRERENDER_ROUTES) {
  const out = route === '/'
    ? join(root, 'dist', 'index.html')
    : join(root, 'dist', route.slice(1), 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, pageHtml(route));
  console.log('prerendered', route, '->', out.slice(root.length + 1));
}

/* Unknown paths on GitHub Pages fall through to 404.html. Bake the real
   NotFound page into it; the client router still takes over for routes that
   do exist client-side (e.g. /admin). */
writeFileSync(join(root, 'dist', '404.html'), pageHtml('/404'));
writeFileSync(join(root, 'dist', '.nojekyll'), '');
console.log('wrote 404.html + .nojekyll');
