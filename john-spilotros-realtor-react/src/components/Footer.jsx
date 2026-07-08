import { Link } from 'react-router-dom';
import { PHONE_DISPLAY, PHONE_TEL, LEAD_EMAIL, OFFICE_ADDRESS, OFFICE_HOURS } from '../data/site.js';

const LINKS = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-main">
          <div className="footer-brand">
            <span className="brand-name" style={{ display: 'block' }}>John Spilotros</span>
            <span className="brand-sub" style={{ display: 'block', marginTop: 6 }}>Licensed Idaho Real Estate Salesperson</span>
            <p>Buyers and sellers across Boise, Meridian, Eagle, Nampa, and the Treasure Valley. One agent, start to close.</p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              {LINKS.map(([to, label]) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Brokerage</h4>
            <span className="kw-chip"><img src="/kw-mark.svg" alt="Keller Williams" /></span>
            <p>Keller Williams Boise<br />
              {OFFICE_ADDRESS}<br />
              {OFFICE_HOURS}<br />
              Each office is independently owned and operated.</p>
            <p style={{ marginTop: '1rem' }}>
              <a href={'tel:' + PHONE_TEL}>{PHONE_DISPLAY}</a><br />
              <a href={'mailto:' + LEAD_EMAIL}>{LEAD_EMAIL}</a>
            </p>
          </div>
        </div>
        <div className="footer-legal">
          <div className="footer-legal-top">
            <span className="eho">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.2" aria-hidden="true">
                <path d="M8 31 32 11 56 31" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M14 28v25h36V28" strokeLinejoin="round" />
                <line x1="24" y1="37" x2="40" y2="37" strokeLinecap="round" />
                <line x1="24" y1="45" x2="40" y2="45" strokeLinecap="round" />
              </svg>
              <span>Equal Housing Opportunity</span>
            </span>
            <span className="license-badge">Idaho License <span>#1681619</span></span>
          </div>
          <p className="disclaimer">
            <strong>John Spilotros is a licensed Idaho real estate salesperson</strong> affiliated with Keller Williams Boise, not a real estate broker or a licensed appraiser. All brokerage services are provided through Keller Williams Boise under the supervision of the responsible broker. Sample homes shown in the search preview are illustrative examples, not active listings. This website is for general informational purposes only and is not intended to solicit buyers or sellers already represented by a broker. No agency relationship is created by using this site or submitting a form; representation begins only with a signed written agreement. John Spilotros is committed to the letter and spirit of U.S. policy for the achievement of equal housing opportunity throughout the nation.
          </p>
          <div className="footer-copy">
            <span>© 2026 John Spilotros · Keller Williams Boise</span>
            <span>Boise &amp; the Treasure Valley, Idaho</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
