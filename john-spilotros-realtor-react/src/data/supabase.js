/* Listings backend (Supabase, free tier) — paste your two project values here.
   Find them in Supabase: Project Settings → API. Until both are filled in,
   the site falls back to the static data/listings.json file and /admin shows
   setup instructions. The anon key is safe to publish — row-level security
   on the database is what protects writes. */

export const SUPABASE_URL = 'https://zwsjdcrjwqkzsxollwnc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_FBnSV2WoIc_7MXSAXM0Xww_uEElzvkk';

export function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/* Public read used by the Listings page — plain fetch so the Supabase SDK
   only ever loads on the /admin route. */
export async function fetchListings() {
  const r = await fetch(
    SUPABASE_URL + '/rest/v1/listings?select=*&order=featured.desc,created_at.desc',
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY } }
  );
  if (!r.ok) throw new Error('listings fetch failed');
  return r.json();
}

let clientPromise = null;

/* Authenticated client for the admin page (lazy-loaded SDK). */
export function getClient() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    );
  }
  return clientPromise;
}
