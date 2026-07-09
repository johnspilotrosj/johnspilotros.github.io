import { Link } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import Magnet from '../bits/Magnet.jsx';

const PILLARS = [
  ['Local market focus', 'The Treasure Valley is the only market I work. When a street starts turning over, I know it.'],
  ['Fast communication', "Calls returned the same day. Deadlines hit early. You'll never wonder where things stand."],
  ['Buyer & seller guidance', 'Both sides of the table, one standard: your interests lead every recommendation.'],
];

const CREDS = [
  ['Role', 'Licensed Real Estate Salesperson'],
  ['Brokerage', 'Keller Williams Boise'],
  ['Idaho License', '#1681619'],
  ['Areas served', 'Boise · Meridian · Eagle · Nampa · Kuna · Star · Garden City'],
];

export default function About() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <h1>The agent who treats your move like his own.</h1>
        </div>
      </section>

      <section className="section" id="about" style={{ paddingTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div className="wrap split">
          <Reveal>
            <div className="portrait">
              <img src="headshot.jpg" alt="John Spilotros, real estate salesperson with Keller Williams Boise" />
            </div>
          </Reveal>
          <Reveal className="split-body" delay={0.08}>
            <div className="prose stack">
              <p>I'm John Spilotros — licensed Idaho real estate salesperson with Keller Williams Boise, and I built my first career in web design and digital marketing. That means your home isn't listed, it's <em>launched</em>: presented sharply, distributed widely, and put in front of the buyers who are actually looking.</p>
              <p>I work one market — Boise and the Treasure Valley — and I work it hard. I answer my phone, I tell you the truth even when it costs me, and I negotiate like the outcome is mine. Because for the weeks we work together, it is.</p>
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
                <p>Backed by Keller Williams Boise.<br />Each office is independently owned and operated.</p>
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
