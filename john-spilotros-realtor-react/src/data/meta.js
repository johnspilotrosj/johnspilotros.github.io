/* Per-route page metadata — single source of truth for the client-side
   MetaManager AND the build-time prerender script. Canonical URLs use
   trailing slashes to match what GitHub Pages actually serves. */
import { CITIES } from './cities.js';

const SITE = 'https://spilo.xyz';

const STATIC_META = {
  '/': {
    title: 'John Spilotros · Real Estate in Boise & the Treasure Valley',
    description: 'John Spilotros is a licensed Idaho real estate salesperson with Keller Williams Boise, helping buyers and sellers move with confidence across Boise, Meridian, Eagle, Nampa, and the Treasure Valley.',
  },
  '/listings': {
    title: 'Homes for Sale · John Spilotros, Keller Williams Boise',
    description: 'Current listings from John Spilotros across Boise and the Treasure Valley, with new homes added as they hit the market. Tell John what you are looking for.',
  },
  '/about': {
    title: 'About John Spilotros · Keller Williams Boise',
    description: 'Licensed Idaho real estate salesperson with Keller Williams Boise. Digital marketing background, one market: Boise and the Treasure Valley.',
  },
  '/contact': {
    title: 'Contact John Spilotros · Boise Real Estate',
    description: 'Call, text, or message John Spilotros, licensed real estate salesperson with Keller Williams Boise. Straight answers, with a reply within one business day.',
  },
};

const CITY_META = Object.fromEntries(
  CITIES.map((c) => [
    '/' + c.slug,
    {
      title: `${c.name}, Idaho Homes & Town Guide · John Spilotros`,
      description: `Homes in ${c.name}, Idaho: what they cost right now, what the town is like, and who it fits. A local guide from John Spilotros, Keller Williams Boise.`,
    },
  ])
);

export function metaForPath(pathname) {
  let p = pathname || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  const m = STATIC_META[p] || CITY_META[p] || STATIC_META['/'];
  return { ...m, url: p === '/' ? SITE + '/' : SITE + p + '/' };
}

/* Routes baked to static HTML at build time (admin stays client-only). */
export const PRERENDER_ROUTES = [
  '/',
  '/listings',
  '/about',
  '/contact',
  ...CITIES.map((c) => '/' + c.slug),
];
