/* Build-time prerender entry — turns each route into real static HTML so
   crawlers (and the first paint) get content without running JS.
   Built via `vite build --ssr`, consumed by scripts/prerender.mjs. */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';

export { metaForPath, PRERENDER_ROUTES } from './data/meta.js';

export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
}
