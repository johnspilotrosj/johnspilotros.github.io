/* Central site config — edit contact details here, in one place. */

export const LEAD_EMAIL = 'johnspilotros@kw.com';

/* Silent background form delivery (optional upgrade):
   create a free form at https://formspree.io and paste its endpoint here,
   e.g. 'https://formspree.io/f/xxxxxxxx'. Left empty, forms open the
   visitor's email client pre-filled (works with no account). */
export const LEAD_ENDPOINT = '';

export const PHONE_DISPLAY = '(215) 859-3267';
export const PHONE_TEL = '+12158593267';

export const OFFICE_ADDRESS_PLACEHOLDER = '[Office address: add before publishing]';

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
export const HERO_POSTER = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';

export const NEIGHBORHOODS = [
  {
    name: 'Boise',
    desc: 'The capital city. North End character, a real downtown, and foothills trails out the back door.',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    alt: 'A contemporary two-story home with clean lines on a quiet Boise street.',
    price: null,
  },
  {
    name: 'Meridian',
    desc: 'The fastest-growing city in the valley. Master-planned neighborhoods and strong schools.',
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80',
    alt: 'A large suburban home with a manicured lawn under a bright sky.',
    price: null,
  },
  {
    name: 'Eagle',
    desc: 'Foothills estates, river frontage, and the valley’s most sought-after custom homes.',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80',
    alt: 'A modern white home with a pool in an upscale neighborhood.',
    price: null,
  },
  {
    name: 'Nampa',
    desc: 'The smart money’s pick. Established neighborhoods, new construction, real value.',
    img: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=80',
    alt: 'A welcoming single-family house with a classic front entrance.',
    price: null,
  },
  {
    name: 'Kuna',
    desc: 'Small-town pace, minutes from everything. Growing fast for a reason.',
    img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80',
    alt: 'A modern home framed by greenery and open sky.',
    price: null,
  },
  {
    name: 'Star',
    desc: 'Riverside acreage and new builds where the valley opens up.',
    img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=80',
    alt: 'A modern home with warm timber cladding and a landscaped walkway.',
    price: null,
  },
  {
    name: 'Garden City',
    desc: 'The valley’s creative streak — river district living beside the Boise Greenbelt.',
    img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=900&q=80',
    alt: 'A crisp modern white house with dark trim.',
    price: null,
  },
];

/* Sample homes for the search preview. Clearly labeled samples — NOT active
   listings (advertising invented inventory would violate IREC rules). Swap in
   real MLS/IDX data once John's MLS access is live. */
export const SAMPLE_HOMES = [
  { id: 1, title: 'Modern craftsman near the North End', area: 'Boise', type: 'Single-family', price: 585000, beds: 4, baths: 2.5, sqft: 2380, img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', alt: 'A contemporary two-story craftsman-style home.' },
  { id: 2, title: 'Master-planned two-story with mountain views', area: 'Meridian', type: 'Single-family', price: 512000, beds: 4, baths: 3, sqft: 2610, img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80', alt: 'A large suburban two-story home with a wide lawn.' },
  { id: 3, title: 'Foothills contemporary with a pool', area: 'Eagle', type: 'Single-family', price: 940000, beds: 5, baths: 4, sqft: 3850, img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80', alt: 'A modern white home with a backyard pool.' },
  { id: 4, title: 'Updated classic on a corner lot', area: 'Nampa', type: 'Single-family', price: 389000, beds: 3, baths: 2, sqft: 1720, img: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=80', alt: 'A single-family home with a classic covered entryway.' },
  { id: 5, title: 'New-build townhome near downtown', area: 'Garden City', type: 'Townhome', price: 429000, beds: 3, baths: 2.5, sqft: 1540, img: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=900&q=80', alt: 'A crisp modern townhome exterior.' },
  { id: 6, title: 'Timber-clad modern on acreage', area: 'Star', type: 'Acreage', price: 765000, beds: 4, baths: 3, sqft: 2940, img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=80', alt: 'A modern home with warm timber cladding on a large lot.' },
];

export const AREAS = ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Garden City'];
