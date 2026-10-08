/* Where a visitor came from, attached to every lead so the email itself says
   "Instagram", "google.com", "Zillow" etc. Works with no analytics account.
   First touch is remembered in this browser (localStorage) so a visitor who
   found the site on Google and came back a week later by typing the address
   still credits Google. Ad/bio links can add ?utm_source=instagram to be exact. */
const KEY = 'lead-src';

function describe() {
  const q = new URLSearchParams(window.location.search);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => q.get(k)).filter(Boolean);
  let via = 'Direct / typed the address';
  if (utm.length) via = utm.join(' / ');
  else if (document.referrer) {
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host && host !== window.location.hostname.replace(/^www\./, '')) via = host;
    } catch (e) { /* malformed referrer */ }
  }
  return { via, landing: window.location.pathname, date: new Date().toISOString().slice(0, 10) };
}

/* Call once on page load. Keeps the first touch; never overwrites it. */
export function rememberLeadSource() {
  try {
    if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(describe()));
  } catch (e) { /* private mode / storage blocked: fall back at submit time */ }
}

export function leadSource() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.via) return saved;
  } catch (e) { /* ignore */ }
  return describe();
}
