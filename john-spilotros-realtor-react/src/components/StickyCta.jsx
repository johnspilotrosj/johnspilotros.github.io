import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PHONE_TEL } from '../data/site.js';

/* Mobile-only bottom bar: call, text, or message from anywhere on the site.
   Hidden on the contact flow (the page already is the CTA) and on admin.
   Desktop hiding is handled in CSS. */
export default function StickyCta() {
  const { pathname } = useLocation();
  const p = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const hidden = p === '/contact' || p === '/thank-you' || p === '/admin';

  useEffect(() => {
    document.body.classList.toggle('has-sticky-cta', !hidden);
    return () => document.body.classList.remove('has-sticky-cta');
  }, [hidden]);

  if (hidden) return null;
  return (
    <div className="sticky-cta">
      <a href={'tel:' + PHONE_TEL}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c1 .3 1.9.5 2.9.7a2 2 0 0 1 1.7 2Z" /></svg>
        Call
      </a>
      <a href={'sms:' + PHONE_TEL}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>
        Text
      </a>
      <Link className="sticky-cta-main" to="/contact">Message John</Link>
    </div>
  );
}
