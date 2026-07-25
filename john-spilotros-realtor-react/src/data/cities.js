/* Longform town-page content. Slugs double as URL paths (spilo.xyz/boise).
   Written in John's voice: plain, a little laid-back, no em dashes.
   Median prices live in site.js NEIGHBORHOODS (single source, Redfin-cited). */
import { NEIGHBORHOODS } from './site.js';

const CONTENT = {
  Boise: {
    slug: 'boise',
    intro: "The capital city and the center of gravity for the whole valley. Downtown, the foothills, the Boise River, and the neighborhoods people move here for.",
    homes: "Boise has the widest range of homes in the valley. North End and East End streets carry older character homes, the Bench is full of solid mid-century houses, and Southeast Boise runs along the river and the Greenbelt. Downtown adds condos and townhomes if you want to walk to everything.",
    fits: "Boise fits people who want the city itself. Trails out the back door, restaurants you can walk to, and a real downtown. You pay for location here, but it's the location everyone measures against.",
  },
  Meridian: {
    slug: 'meridian',
    intro: "The fastest-growing city in Idaho, sitting dead center in the valley. Master-planned neighborhoods, strong schools, and shopping at The Village.",
    homes: "Most of Meridian is newer construction: planned subdivisions with parks, ponds, and HOAs that keep things tidy. Family-sized layouts are the norm, and builders are still adding new phases across the city.",
    fits: "Meridian fits families and commuters. You're twenty minutes from almost everywhere in the valley, the schools draw people in, and the neighborhoods are built for kids on bikes.",
  },
  Eagle: {
    slug: 'eagle',
    intro: "The valley's high end. Foothills estates, Boise River frontage, and custom homes on real acreage, with a small downtown that still feels like a town.",
    homes: "Eagle is custom country. Gated communities in the foothills, homes backing the river, and lots with room for a shop. New construction here leans large and finished to a high standard.",
    fits: "Eagle fits buyers who want space and privacy without leaving the valley. It's the highest median price of the seven towns, and it earns it.",
  },
  Nampa: {
    slug: 'nampa',
    intro: "The smart money's pick. Nampa gives you the most house for the money in the valley, with established neighborhoods, a growing downtown, and new construction all over.",
    homes: "You'll find solid older homes near downtown, big newer subdivisions on the edges, and everything between. Builders are active here, so brand-new at a reasonable price is a real option.",
    fits: "Nampa fits first-time buyers and anyone stretching a budget. You trade a longer drive to Boise for more square footage, a bigger lot, and a lower payment.",
  },
  Kuna: {
    slug: 'kuna',
    intro: "Small-town pace, minutes from everything. Kuna keeps its farm-town feel while new neighborhoods grow around it.",
    homes: "Mostly newer subdivisions with family layouts and honest prices, plus some acreage on the edges of town. You get new-construction value without going far from Meridian and Boise.",
    fits: "Kuna fits people who want quiet streets and a slower pace but still work in the city. It's one of the best value plays in the valley right now.",
  },
  Star: {
    slug: 'star',
    intro: "Where the valley opens up. Star sits on the Boise River between Eagle and Middleton, with riverside acreage and new builds spreading through town.",
    homes: "Newer subdivisions make up most of the market, with acreage and riverfront properties mixed in. It grew fast for a reason: you get newer homes and more land while staying close to Eagle and Meridian.",
    fits: "Star fits buyers who want elbow room. If Eagle's prices are a stretch but you want that side of the valley, Star is the move.",
  },
  'Garden City': {
    slug: 'garden-city',
    intro: "The valley's creative side. Garden City runs along the Boise River and the Greenbelt, packed with breweries, studios, and workshops.",
    homes: "The mix here is unlike anywhere else in the valley: older affordable homes, new riverfront townhomes, and live-work spaces side by side. It's changing fast, and the river location is the constant.",
    fits: "Garden City fits people who want the Greenbelt out their door and Boise a few minutes away. It's the closest thing the valley has to a river district.",
  },
};

export const CITIES = NEIGHBORHOODS.map((n) => ({ ...n, ...CONTENT[n.name] }));
