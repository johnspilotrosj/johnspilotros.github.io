/* Per-route page metadata — single source of truth for the client-side
   MetaManager AND the build-time prerender script. Canonical URLs use
   trailing slashes to match what GitHub Pages actually serves. */
import { CITIES } from './cities.js';

const SITE = 'https://spilo.xyz';

const STATIC_META = {
  '/': {
    title: 'John Spilotros · Real Estate in Boise & the Treasure Valley',
    description: 'John Spilotros is a licensed Idaho real estate salesperson with Keller Williams Realty Boise, helping buyers and sellers move with confidence across Boise, Meridian, Eagle, Nampa, and the Treasure Valley.',
  },
  '/listings': {
    title: 'Homes for Sale · John Spilotros, Keller Williams Realty Boise',
    description: 'Current listings from John Spilotros across Boise and the Treasure Valley, with new homes added as they hit the market. Tell John what you are looking for.',
  },
  '/buy': {
    title: 'Buy a Home in Boise & the Treasure Valley · John Spilotros',
    description: 'How buying a home works in Boise and the Treasure Valley: the process step by step, what it actually costs, and straight answers to the questions buyers ask first.',
  },
  '/sell': {
    title: 'Sell Your Home in the Treasure Valley · John Spilotros',
    description: 'How John Spilotros runs a home sale in Boise and the Treasure Valley: pricing from real comparable sales, marketing done by a former digital marketer, and straight answers on costs and timing.',
  },
  '/relocation': {
    title: 'Moving to Boise & the Treasure Valley · Relocation Guide',
    description: 'Relocating to Boise, Meridian, Eagle, or anywhere in the Treasure Valley? Video tours, electronic signing, and a local agent as your eyes on the ground. Town guides and straight answers inside.',
  },
  '/about': {
    title: 'About John Spilotros · Keller Williams Realty Boise',
    description: 'Licensed Idaho real estate salesperson with Keller Williams Realty Boise. Digital marketing background, one market: Boise and the Treasure Valley.',
  },
  '/contact': {
    title: 'Contact John Spilotros · Boise Real Estate',
    description: 'Call, text, or message John Spilotros, licensed real estate salesperson with Keller Williams Realty Boise. Straight answers, with a reply within one business day.',
  },
  '/privacy': {
    title: 'Privacy Policy · John Spilotros',
    description: 'What this site collects, how it is used, and how to reach John Spilotros about your information. The plain-language version.',
  },
  '/thank-you': {
    title: 'Thank You · John Spilotros',
    description: 'Your message is in. John reads every message personally and replies within one business day.',
    noindex: true,
  },
  '/404': {
    title: 'Page Not Found · John Spilotros',
    description: 'That page is not here, but the rest of the site is one click away.',
    noindex: true,
  },
};

const CITY_META = Object.fromEntries(
  CITIES.map((c) => [
    '/' + c.slug,
    {
      title: `${c.name}, Idaho Homes & Town Guide · John Spilotros`,
      description: `Homes in ${c.name}, Idaho: what they cost right now, what the town is like, and who it fits. A local guide from John Spilotros, Keller Williams Realty Boise.`,
    },
  ])
);

export function metaForPath(pathname) {
  let p = pathname || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  /* Unknown paths (including /admin) get the noindexed 404 meta. */
  const m = STATIC_META[p] || CITY_META[p] || STATIC_META['/404'];
  return { ...m, url: p === '/' ? SITE + '/' : SITE + p + '/' };
}

/* Routes baked to static HTML at build time (admin stays client-only;
   /404 is handled separately in prerender.mjs and becomes 404.html). */
export const PRERENDER_ROUTES = [
  '/',
  '/listings',
  '/buy',
  '/sell',
  '/relocation',
  '/about',
  '/contact',
  '/privacy',
  '/thank-you',
  ...CITIES.map((c) => '/' + c.slug),
];
