import { Link } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import Magnet from '../bits/Magnet.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';

const PILLARS = [
  ['Local market focus', 'The Treasure Valley is the only market I work, so I know what homes are actually selling for, town by town.'],
  ['Fast communication', 'Calls returned the same day and deadlines hit early. You always know where things stand.'],
  ['Buyer & seller guidance', "Whether you're buying or selling, my advice is based on what's best for you, not on what closes fastest."],
];

const CREDS = [
  ['Role', 'Licensed Real Estate Salesperson'],
  ['Brokerage', 'Keller Williams Realty Boise'],
  ['Idaho License', '#1681619'],
  ['Areas served', 'Boise · Meridian · Eagle · Nampa · Kuna · Star · Garden City'],
];

export default function About() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <Breadcrumbs current="About" path="/about" />
          <h1>Meet John Spilotros.</h1>
        </div>
      </section>

      <section className="section" id="about" style={{ paddingTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div className="wrap split">
          <Reveal>
            <div className="portrait">
              <img src="/headshot.jpg" alt="John Spilotros, real estate salesperson with Keller Williams Realty Boise" />
            </div>
          </Reveal>
          <Reveal className="split-body" delay={0.08}>
            <div className="prose stack">
              <p>I'm a licensed real estate agent with Keller Williams Realty Boise. Before real estate, I spent years building websites and running digital marketing, so when I list a home, the photos, the write-up, and the online reach get done right. That background is a real advantage in a market where nearly every buyer starts their search online.</p>
              <p>I work one market: Boise and the Treasure Valley. I answer my phone, I give you a straight answer even when it's not the one you want, and I stay on top of every detail from the first showing to closing day.</p>
            </div>
            <div className="pillars">
              {PILLARS.map(([t, b]) => (
                <div className="pillar" key={t}><h3>{t}</h3><p>{b}</p></div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <Reveal>
            <div className="creds-row">
              <dl className="creds">
                {CREDS.map(([dt, dd]) => (
                  <div className="cred" key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>
                ))}
              </dl>
              <div className="kw-strip">
                <img src="/kw-mark.svg" alt="Keller Williams" />
                <p>Backed by Keller Williams Realty Boise.<br />Each office is independently owned and operated.</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="about-cta">
              <Magnet><Link className="btn btn-dark" to="/contact">Book a Consultation</Link></Magnet>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
