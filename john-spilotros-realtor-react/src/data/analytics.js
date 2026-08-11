import { GA_MEASUREMENT_ID } from './site.js';

/* Google Analytics 4, loaded lazily on the first pageview and only when a
   measurement ID is set in site.js. Pageviews are sent manually on every
   route change so SPA navigation is counted, not just the first load. */
let loaded = false;

export function trackPageview(path) {
  if (!GA_MEASUREMENT_ID || typeof document === 'undefined') return;
  if (!loaded) {
    loaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
  }
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: document.title,
  });
}
