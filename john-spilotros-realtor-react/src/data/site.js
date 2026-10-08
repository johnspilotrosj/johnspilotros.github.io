/* Central site config — edit contact details here, in one place. */

export const LEAD_EMAIL = 'johnspilotros@kw.com';

/* Silent background form delivery (optional upgrade):
   create a free form at https://formspree.io and paste its endpoint here,
   e.g. 'https://formspree.io/f/xxxxxxxx'. Left empty, forms open the
   visitor's email client pre-filled (works with no account). */
export const LEAD_ENDPOINT = 'https://formspree.io/f/mvzjjkjb';

/* Google Analytics 4 measurement ID, e.g. 'G-XXXXXXXXXX'. Left empty,
   analytics never loads and no cookies are set. Get one free at
   https://analytics.google.com → Admin → Data streams → Web. */
export const GA_MEASUREMENT_ID = '';

export const PHONE_DISPLAY = '(215) 859-3267';
export const PHONE_TEL = '+12158593267';

export const OFFICE_ADDRESS = '1065 S Allante Pl, Boise, ID 83709';
export const OFFICE_HOURS = 'Mon–Fri · 9am–5pm';

/* Social profiles — paste real URLs before publishing (icons hide while empty). */
export const SOCIALS = [
  { name: 'Instagram', url: 'https://www.instagram.com/houseswithjohn/' },
  { name: 'Facebook', url: '' },
  { name: 'LinkedIn', url: '' },
];

/* Real client stories — the "Recent moves" section stays hidden while this
   list is empty. As deals close, add entries like:
   {
     tag: 'Seller',                    // or 'Buyer'
     location: 'Meridian',
     title: 'Sold in 9 days, $12K over list',
     story: 'One or two sentences on the situation and what we did.',
     result: 'The outcome in one line: price, days on market, or terms won.',
   }
   Real deals only — no composites, no invented numbers. */
export const CASE_STUDIES = [];

/* One reply-time promise, used everywhere the site says how fast John answers. */
export const REPLY_PROMISE = 'within one business day';

/* Google Business Profile link (the "share" link from your profile, or your
   g.page / maps link). While empty, the "See my Google reviews" link hides. */
export const GOOGLE_PROFILE_URL = '';

/* Real client reviews — the "What clients say" section on the home page and
   About page stays hidden while this list is empty. Copy them word for word
   from Google, Zillow, or a client's text/email (ask them first), e.g.
   {
     quote: 'John found us a house in Meridian in two weeks...',
     name: 'Sarah M.',                 // first name + last initial is fine
     detail: 'Bought in Meridian',     // or 'Sold in Boise', 'Relocated from CA'
     source: 'Google',                 // where the review lives, optional
     stars: 5,                         // optional, only if the review had stars
   }
   Real reviews only — no paraphrasing, no composites. */
export const TESTIMONIALS = [];

/* Hero drone footage, hosted on this site (public/hero/) so it can't break
   or slow down when a third party changes something. One 14-second 720p clip
   (~1.6 MB) plays on desktop; phones get only the still image (~70 KB).
   Source: Pexels video 5031099, free license — see public/hero/CREDITS.md. */
export const HERO_VIDEO = '/hero/suburb.mp4';
export const HERO_STILL = '/hero/suburb-1280.jpg';
export const HERO_STILL_SMALL = '/hero/suburb-800.jpg';

/* Median sale prices from each town's Redfin "housing market" page
   (redfin.com/city/.../housing-market). Update every month or two: change the
   prices below AND PRICES_AS_OF (the last month of Redfin's 3-month window),
   which every page shows next to the prices. */
export const PRICES_AS_OF = 'August 2026';

/* slug = the town page URL (spilo.xyz/boise); longform copy in cities.js. */
export const NEIGHBORHOODS = [
  {
    name: 'Boise',
    slug: 'boise',
    desc: 'The capital city. North End character, a real downtown, and foothills trails out the back door.',
    img: '/towns/boise.jpg',
    alt: 'Downtown Boise, Idaho, with the foothills behind it.',
    price: '$545K',
  },
  {
    name: 'Meridian',
    slug: 'meridian',
    desc: 'The fastest-growing city in the valley. Master-planned neighborhoods and strong schools.',
    img: '/towns/meridian.jpg',
    alt: 'The Meridian Idaho Temple in springtime.',
    price: '$567K',
  },
  {
    name: 'Eagle',
    slug: 'eagle',
    desc: 'Foothills estates, river frontage, and the valley’s most sought-after custom homes.',
    img: '/towns/eagle.jpg',
    alt: 'The City of Eagle, Idaho welcome sign.',
    price: '$941K',
  },
  {
    name: 'Nampa',
    slug: 'nampa',
    desc: 'The smart money’s pick. Established neighborhoods, new construction, real value.',
    img: '/towns/nampa.jpg',
    alt: 'The historic Nampa Department Store in downtown Nampa.',
    price: '$418K',
  },
  {
    name: 'Kuna',
    slug: 'kuna',
    desc: 'Small-town pace, minutes from everything. Growing fast for a reason.',
    img: '/towns/kuna.jpg',
    alt: 'Main Street in downtown Kuna, Idaho.',
    price: '$479K',
  },
  {
    name: 'Star',
    slug: 'star',
    desc: 'Riverside acreage and new builds where the valley opens up.',
    img: '/towns/star.jpg',
    alt: 'The historic Star Mercantile building in Star, Idaho.',
    price: '$596K',
  },
  {
    name: 'Garden City',
    slug: 'garden-city',
    desc: 'The valley’s creative side. River district living right on the Boise Greenbelt.',
    img: '/towns/garden-city.jpg',
    alt: 'An aerial view of Garden City, Idaho, in summertime.',
    price: '$595K',
  },
];

export const AREAS = ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Garden City'];
