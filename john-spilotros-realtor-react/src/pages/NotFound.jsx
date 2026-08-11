import { Link } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import { NEIGHBORHOODS, PHONE_DISPLAY, PHONE_TEL } from '../data/site.js';

export default function NotFound() {
  return (
    <section className="page-head notfound">
      <div className="wrap">
        <p className="kicker">404</p>
        <h1>That page isn't here.</h1>
        <p>The link is old or the address has a typo. Either way, everything on this site is one click below.</p>
        <Reveal>
          <div className="cta-actions notfound-actions">
            <Link className="btn btn-gold" to="/">Back to the homepage</Link>
            <Link className="btn btn-line" to="/listings">See current listings</Link>
            <Link className="btn btn-line" to="/contact">Contact John</Link>
          </div>
          <nav className="towns-row" aria-label="Treasure Valley town guides">
            {NEIGHBORHOODS.map((n) => (
              <Link key={n.slug} className="town-chip" to={'/' + n.slug}>{n.name}</Link>
            ))}
          </nav>
          <p className="notfound-call">Looking for something specific? Call or text <a href={'tel:' + PHONE_TEL}>{PHONE_DISPLAY}</a>.</p>
        </Reveal>
      </div>
    </section>
  );
}
