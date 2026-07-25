/* Central site config — edit contact details here, in one place. */

export const LEAD_EMAIL = 'johnspilotros@kw.com';

/* Silent background form delivery (optional upgrade):
   create a free form at https://formspree.io and paste its endpoint here,
   e.g. 'https://formspree.io/f/xxxxxxxx'. Left empty, forms open the
   visitor's email client pre-filled (works with no account). */
export const LEAD_ENDPOINT = 'https://formspree.io/f/mvzjjkjb';

export const PHONE_DISPLAY = '(215) 859-3267';
export const PHONE_TEL = '+12158593267';

export const OFFICE_ADDRESS = '1065 S Allante Pl, Boise, ID 83709';
export const OFFICE_HOURS = 'Mon–Fri · 9am–5pm';

/* Social profiles — paste real URLs before publishing (icons hide while empty). */
export const SOCIALS = [
  { name: 'Instagram', url: '' },
  { name: 'Facebook', url: '' },
  { name: 'LinkedIn', url: '' },
];

/* Hero drone footage (Pexels, free license) — city → suburb → farm.
   Each clip crossfades to the next; playback is slowed for the drift. */
export const HERO_CLIPS = [
  { src: 'https://videos.pexels.com/video-files/4761059/4761059-hd_1920_1080_30fps.mp4', hold: 12 },
  { src: 'https://videos.pexels.com/video-files/5031099/5031099-hd_1920_1080_30fps.mp4', hold: 12 },
  { src: 'https://videos.pexels.com/video-files/5200374/5200374-hd_1920_1080_30fps.mp4', hold: 12 },
];

/* Median sale prices: Redfin city market data, May 2026. Update monthly-ish.
   slug = the town page URL (spilo.xyz/boise); longform copy in cities.js. */
export const NEIGHBORHOODS = [
  {
    name: 'Boise',
    slug: 'boise',
    desc: 'The capital city. North End character, a real downtown, and foothills trails out the back door.',
    img: '/towns/boise.jpg',
    alt: 'Downtown Boise, Idaho, with the foothills behind it.',
    price: '$525K',
  },
  {
    name: 'Meridian',
    slug: 'meridian',
    desc: 'The fastest-growing city in the valley. Master-planned neighborhoods and strong schools.',
    img: '/towns/meridian.jpg',
    alt: 'The Meridian Idaho Temple in springtime.',
    price: '$550K',
  },
  {
    name: 'Eagle',
    slug: 'eagle',
    desc: 'Foothills estates, river frontage, and the valley’s most sought-after custom homes.',
    img: '/towns/eagle.jpg',
    alt: 'The City of Eagle, Idaho welcome sign.',
    price: '$799K',
  },
  {
    name: 'Nampa',
    slug: 'nampa',
    desc: 'The smart money’s pick. Established neighborhoods, new construction, real value.',
    img: '/towns/nampa.jpg',
    alt: 'The historic Nampa Department Store in downtown Nampa.',
    price: '$420K',
  },
  {
    name: 'Kuna',
    slug: 'kuna',
    desc: 'Small-town pace, minutes from everything. Growing fast for a reason.',
    img: '/towns/kuna.jpg',
    alt: 'Main Street in downtown Kuna, Idaho.',
    price: '$449K',
  },
  {
    name: 'Star',
    slug: 'star',
    desc: 'Riverside acreage and new builds where the valley opens up.',
    img: '/towns/star.jpg',
    alt: 'The historic Star Mercantile building in Star, Idaho.',
    price: '$570K',
  },
  {
    name: 'Garden City',
    slug: 'garden-city',
    desc: 'The valley’s creative side. River district living right on the Boise Greenbelt.',
    img: '/towns/garden-city.jpg',
    alt: 'An aerial view of Garden City, Idaho, in summertime.',
    price: '$533K',
  },
];

export const AREAS = ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Garden City'];
