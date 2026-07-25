import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import { CITIES } from '../data/cities.js';
import { prefillContact } from '../data/prefill.js';

export default function CityPage({ city }) {
  const navigate = useNavigate();
  const others = CITIES.filter((c) => c.slug !== city.slug);

  function askJohn() {
    prefillContact(`Tell me about ${city.name}. What's the market like there right now?`);
    navigate('/contact');
  }

  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="kicker">Treasure Valley towns</p>
          <h1>Homes in {city.name}, Idaho.</h1>
          <p>{city.intro}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <Reveal>
            <div className="city-photo"><img src={city.img} alt={city.alt} /></div>
            <p className="city-stat">
              Median sale price: <strong>{city.price}</strong>
              <small>Redfin city market data, May 2026</small>
            </p>
          </Reveal>
          <Reveal className="split-body" delay={0.08}>
            <div className="prose stack">
              <h3>The homes</h3>
              <p>{city.homes}</p>
              <h3>Who {city.name} fits</h3>
              <p>{city.fits}</p>
            </div>
            <nav className="towns-row" aria-label="More Treasure Valley towns">
              {others.map((c) => (
                <Link key={c.slug} className="town-chip" to={'/' + c.slug}>{c.name}</Link>
              ))}
            </nav>
          </Reveal>
        </div>
      </section>

      <section className="section section-dark cta-band">
        <Reveal className="wrap">
          <h2>Want a closer look at {city.name}?</h2>
          <p>Tell me what you're after and I'll give you a straight read on the {city.name} market, plus homes that fit as they come up.</p>
          <div className="cta-actions">
            <button type="button" className="btn btn-gold" onClick={askJohn}>Ask John about {city.name} <span className="arrow">→</span></button>
            <Link className="btn btn-glass" to="/listings">See current listings</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
