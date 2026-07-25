import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metaForPath } from '../data/meta.js';

/* Keeps the document head in sync with the route on the client. The same
   values are baked into each page's static HTML by scripts/prerender.mjs,
   so crawlers see them without running JS. */
export default function MetaManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = metaForPath(pathname);
    document.title = m.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', m.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', m.url);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', m.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', m.description);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', m.url);
  }, [pathname]);
  return null;
}
