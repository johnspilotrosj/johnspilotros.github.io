import { Link } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import BlurText from '../bits/BlurText.jsx';
import Magnet from '../bits/Magnet.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';

const VALUES = [
  {
    title: 'Straight talk',
    body: "No pressure and no jargon. You'll always know where things stand and what your real options are.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />,
  },
  {
    title: 'Local knowledge',
    body: 'Boise, Meridian, Eagle, Nampa, and beyond. I know the neighborhoods, not just the listings.',
    icon: <><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  },
  {
    title: 'Always responsive',
    body: 'You get a real person who answers, returns calls, and treats your timeline like it actually matters.',
    icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />,
  },
  {
    title: 'Your interests first',
    body: 'As your agent I represent you, and your goals lead every recommendation I make.',
    icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  },
];

const CREDS = [
  ['Role', 'Licensed Real Estate Salesperson'],
  ['Brokerage', 'Keller Williams Boise'],
  ['Idaho License', '#1681619'],
  ['Areas served', 'Boise · Meridian · Eagle · Nampa · the Treasure Valley'],
  ['Specialties', 'Buyers, sellers, relocation & listing marketing'],
  ['Licensed', 'Idaho, 2026'],
];

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">About John</p>
          <h1>A straight answer and a steady hand.</h1>
          <p>Get to know the person you'd be trusting with your move — how I work, what I value, and why clients keep my number saved.</p>
        </div>
      </section>

      <section className="section">
        <Reveal className="wrap split">
          {/* PLACEHOLDER: replace this monogram with John's real professional headshot
              (e.g. <img src="assets/john.jpg" alt="John Spilotros, real estate salesperson">). */}
          <div className="split-media" style={{ aspectRatio: '4/5', boxShadow: 'none' }}>
            <div className="portrait">
              <span className="portrait-mono">JS</span>
              <span className="portrait-note">Add your headshot here</span>
            </div>
          </div>
          <div className="split-body">
            <p className="kicker">My story</p>
            <h2>A marketer's eye on the biggest move you'll make.</h2>
            <div className="prose stack">
              <p>Before real estate, I built my career in web design and digital marketing&nbsp;— creating brands online and getting them found. I bring that same toolkit to selling homes: sharp listing presentation, real online reach, and marketing that actually puts your property in front of ready buyers, not just a sign in the yard.</p>
              <p>The rest of my approach is simple. I listen first, I tell you the truth even when it isn't what you hoped to hear, and I stay organized so nothing slips through the cracks. You'll never feel like just another transaction, because you aren't one.</p>
              <p>I'm proud to call the Treasure Valley home, and helping people land in the right corner of it&nbsp;— Boise, Meridian, Eagle, Nampa, and beyond&nbsp;— is genuinely the part of this job I love most.</p>
            </div>
            <p style={{ marginTop: '1.8rem' }}><Link className="link-arrow" to="/contact">Get in touch</Link></p>
          </div>
        </Reveal>
      </section>

      <section className="section" style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)' }}>
        <div className="wrap">
          <Reveal className="sec-head">
            <p className="kicker">How I work</p>
            <h2><BlurText text="A few things you can count on." /></h2>
          </Reveal>
          <div className="values">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <SpotlightCard className="value">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{v.icon}</svg>
                    {v.title}
                  </h3>
                  <p>{v.body}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head">
            <p className="kicker">The details</p>
            <h2><BlurText text="Credentials & coverage." /></h2>
          </Reveal>
          <Reveal>
            <dl className="creds">
              {CREDS.map(([dt, dd]) => (
                <div className="cred" key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="cta-band">
        <Reveal className="wrap">
          <h2>Have a question? Just ask.</h2>
          <p>Whether you're ready to start or simply weighing your options, I'm happy to talk it through with no obligation.</p>
          <div className="cta-actions">
            <Magnet><Link className="btn btn-accent" to="/contact">Get in touch <span className="arrow">→</span></Link></Magnet>
            <Magnet><Link className="btn btn-on-dark" to="/buyers-sellers">Buyers &amp; sellers</Link></Magnet>
          </div>
        </Reveal>
      </section>
    </>
  );
}
