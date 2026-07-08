import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import SplitText from '../bits/SplitText.jsx';
import Reveal from '../bits/Reveal.jsx';
import Magnet from '../bits/Magnet.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import LeadForm from '../components/LeadForm.jsx';
import {
  HERO_CLIPS, HERO_POSTER, NEIGHBORHOODS, SAMPLE_HOMES, AREAS,
  PHONE_DISPLAY, PHONE_TEL, LEAD_EMAIL, SOCIALS, OFFICE_ADDRESS, OFFICE_HOURS,
} from '../data/site.js';

const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

/* Any section can prefill + jump to the contact form. */
function prefillContact(message) {
  window.dispatchEvent(new CustomEvent('prefill-contact', { detail: message }));
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============ Hero: slow drone drift, city → suburb → farm ============ */
function VideoHero() {
  const reduced = useReducedMotion();
  const vA = useRef(null);
  const vB = useRef(null);
  const [frontIsA, setFrontIsA] = useState(true);

  useEffect(() => {
    if (reduced) return;
    const a = vA.current, b = vB.current;
    if (!a || !b) return;
    let cancelled = false;
    let started = false;
    let timers = [];

    const clip = (i) => HERO_CLIPS[i % HERO_CLIPS.length];
    function prep(v, i) { v.src = clip(i).src; v.loop = true; v.load(); }
    function roll(v) {
      try { v.playbackRate = 0.55; } catch (e) { /* older browsers */ }
      v.play().catch(() => { /* autoplay blocked: poster stays */ });
    }
    function cycle(front, back, i) {
      roll(front);
      prep(back, i + 1);
      timers.push(setTimeout(() => {
        if (cancelled) return;
        roll(back);
        setFrontIsA((f) => !f);
        timers.push(setTimeout(() => {
          if (cancelled) return;
          front.pause();
          cycle(back, front, i + 1);
        }, 1400)); /* wait out the crossfade before recycling */
      }, clip(i).hold * 1000));
    }
    function start() {
      if (started || cancelled) return;
      started = true;
      prep(a, 0);
      cycle(a, b, 0);
    }
    function onVisible() { if (document.visibilityState === 'visible') start(); }

    /* background tab at load: hold the poster, start the reel on first view */
    if (document.visibilityState === 'visible') start();
    else document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      document.removeEventListener('visibilitychange', onVisible);
      a.pause(); b.pause();
    };
  }, [reduced]);

  return (
    <section className="hero" id="top">
      <div className="hero-media" aria-hidden="true">
        <img className="hero-poster" src={HERO_POSTER} alt="" />
        {!reduced && (
          <>
            <video ref={vA} className={'hero-video' + (frontIsA ? ' is-front' : '')} muted playsInline autoPlay preload="auto" />
            <video ref={vB} className={'hero-video' + (!frontIsA ? ' is-front' : '')} muted playsInline preload="none" />
          </>
        )}
        <div className="hero-scrim" />
      </div>
      <div className="wrap hero-content">
        <p className="hero-eyeline">John Spilotros · Keller Williams Boise</p>
        <h1><SplitText text="Your Next Move Starts Here" /></h1>
        <p className="hero-sub">Helping buyers and sellers navigate Boise, Meridian, Eagle, Nampa, and the Treasure Valley with confidence.</p>
        <div className="hero-actions">
          <Magnet><a className="btn btn-gold" href="#search">Search Homes</a></Magnet>
          <Magnet><a className="btn btn-glass" href="#contact">Book a Consultation</a></Magnet>
        </div>
      </div>
      <a className="hero-scroll" href="#search" aria-label="Scroll to home search">
        <span></span>
      </a>
    </section>
  );
}

/* ============ Interactive search preview ============ */
const PRICE_CAPS = [
  ['Any price', Infinity],
  ['Under $450k', 450000],
  ['Under $600k', 600000],
  ['Under $800k', 800000],
  ['Under $1M', 1000000],
];

function SearchPreview() {
  const [area, setArea] = useState('All areas');
  const [cap, setCap] = useState(0);
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [type, setType] = useState('Any type');

  const results = SAMPLE_HOMES.filter((h) =>
    (area === 'All areas' || h.area === area) &&
    h.price <= PRICE_CAPS[cap][1] &&
    h.beds >= beds &&
    h.baths >= baths &&
    (type === 'Any type' || h.type === type)
  );

  const selects = [
    { id: 'f-area', label: 'Location', value: area, set: setArea, opts: ['All areas', ...AREAS] },
    { id: 'f-price', label: 'Price', value: cap, set: (v) => setCap(+v), opts: PRICE_CAPS.map((p, i) => [i, p[0]]) },
    { id: 'f-beds', label: 'Beds', value: beds, set: (v) => setBeds(+v), opts: [[0, 'Any beds'], [2, '2+'], [3, '3+'], [4, '4+']] },
    { id: 'f-baths', label: 'Baths', value: baths, set: (v) => setBaths(+v), opts: [[0, 'Any baths'], [2, '2+'], [3, '3+']] },
    { id: 'f-type', label: 'Type', value: type, set: setType, opts: ['Any type', 'Single-family', 'Townhome', 'Acreage'] },
  ];

  return (
    <section className="section" id="search">
      <div className="wrap">
        <Reveal className="sec-head">
          <h2>Find the one.</h2>
          <p>Set your terms. When the right home hits the market, you'll be the first call — not the last offer.</p>
        </Reveal>
        <Reveal>
          <div className="filters" role="group" aria-label="Home search filters">
            {selects.map((f) => (
              <label key={f.id} className="filter">
                <span>{f.label}</span>
                <select className="select" id={f.id} value={f.value} onChange={(e) => f.set(e.target.value)}>
                  {f.opts.map((o) => Array.isArray(o)
                    ? <option key={o[0]} value={o[0]}>{o[1]}</option>
                    : <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
        </Reveal>
        <p className="sample-note">Preview with sample homes — live MLS search lands here once my board access is active. Tell me what you're after and I'll run the real search today.</p>
        {results.length > 0 ? (
          <div className="homes-grid">
            {results.map((h, i) => (
              <Reveal key={h.id} delay={Math.min(i * 0.06, 0.3)}>
                <article className="home-card">
                  <div className="home-media">
                    <img loading="lazy" src={h.img} alt={h.alt} />
                    <span className="home-badge">Sample · not a listing</span>
                  </div>
                  <div className="home-body">
                    <div className="home-price">{money(h.price)}</div>
                    <h3>{h.title}</h3>
                    <div className="home-specs">
                      <span><strong>{h.beds}</strong> bd</span>
                      <span><strong>{h.baths}</strong> ba</span>
                      <span><strong>{h.sqft.toLocaleString('en-US')}</strong> sqft</span>
                      <span className="home-area">{h.area}</span>
                    </div>
                    <button type="button" className="btn btn-line home-cta" onClick={() => prefillContact(`I'm looking for something like the "${h.title}" example (${h.area}, around ${money(h.price)}). What's actually out there right now?`)}>
                      Find me one like this
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="homes-empty">
            <h3>Nothing in the samples fits that combination.</h3>
            <p>The real inventory is deeper. Tell me exactly what you want — I'll find it.</p>
            <button type="button" className="btn btn-dark" onClick={() => prefillContact("Here's what I'm looking for: ")}>Start my search</button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============ Featured neighborhoods ============ */
function Neighborhoods() {
  return (
    <section className="section section-alt" id="neighborhoods">
      <div className="wrap">
        <Reveal className="sec-head">
          <h2>Know the valley. Own your corner of it.</h2>
          <p>Seven cities, seven personalities. I'll tell you what each one is really like — and what your money buys there.</p>
        </Reveal>
        <div className="hood-grid">
          {NEIGHBORHOODS.map((n, i) => (
            <Reveal key={n.name} delay={Math.min(i * 0.05, 0.3)}>
              <article className="hood-card">
                <div className="hood-media"><img loading="lazy" src={n.img} alt={n.alt} /></div>
                <div className="hood-body">
                  <h3>{n.name}</h3>
                  <p>{n.desc}</p>
                  <p className="hood-price">Median price: <span className="placeholder-val">{n.price || '[add current figure]'}</span></p>
                  <button type="button" className="link-gold" onClick={() => prefillContact(`Tell me about ${n.name} — what's the market like there right now?`)}>
                    Explore {n.name} →
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Buyers ============ */
const BUYER_STEPS = [
  ['Get pre-approved', "Know your number before you fall for a house. I'll connect you with lenders who move fast.", 'A pre-approval letter makes your offer real. Sellers read it first.'],
  ['Tour homes', "We see the homes worth seeing — and I'll tell you the truth about every one of them.", 'The right home usually shows up in week two or three. Be ready to move.'],
  ['Make the offer', 'Structured to win: price, terms, and timing built from what the seller actually cares about.', "The highest number doesn't always win. The cleanest offer often does."],
  ['Inspection & appraisal', 'I manage the deadlines, the negotiations, and the repair asks. You stay in control.', 'This is where deals get better — or die. Mine get better.'],
  ['Closing day', "Signatures, keys, done. And I'm still your agent after the boxes are unpacked.", 'Average time from accepted offer to keys: about 30 days.'],
];

function Buyers() {
  const [active, setActive] = useState(null);
  return (
    <section className="section" id="buyers">
      <div className="wrap">
        <Reveal className="sec-head">
          <h2>Buying, without the guesswork.</h2>
          <p>Five steps. I run all of them, you make the decisions. Tap a step to see how it plays out.</p>
        </Reveal>
        <div className="steps">
          {BUYER_STEPS.map(([title, body, tip], i) => (
            <Reveal key={title} delay={i * 0.07}>
              <SpotlightCard className={'step' + (active === i ? ' is-active' : '')}>
                <button type="button" className="step-hit" onClick={() => setActive(active === i ? null : i)} aria-expanded={active === i}>
                  <span className="step-n">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  {active === i && <p className="step-tip">{tip}</p>}
                </button>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ Sellers ============ */
const SELLER_MOVES = [
  ['Pricing', 'Priced from real comparable sales, not wishful thinking. The right number creates competition.'],
  ['Marketing', 'Professional presentation and real online reach. I did digital marketing before real estate — your home gets both.'],
  ['Staging', 'Straight advice on what to fix, what to stage, and what to leave alone.'],
  ['Negotiation', 'When offers land, I work the terms as hard as the price.'],
  ['Closing', 'Deadlines met, surprises handled, proceeds in your account.'],
];

function Sellers() {
  return (
    <section className="section section-alt" id="sellers">
      <div className="wrap split">
        <Reveal className="split-body">
          <h2>Sell it well. Not just fast.</h2>
          <p className="lead-in">Your home will sell. The question is for how much, and how smoothly. Here's how I stack the odds:</p>
          <dl className="moves">
            {SELLER_MOVES.map(([t, b]) => (
              <div className="move" key={t}><dt>{t}</dt><dd>{b}</dd></div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="tool">
            <h3>Thinking about selling?</h3>
            <p className="tool-sub">One straight conversation about your home, your timing, and what the market is doing on your street. No obligation — just a real answer from a real agent.</p>
            <button type="button" className="btn btn-gold" style={{ width: '100%' }} onClick={() => prefillContact("I'm thinking about selling my home. Here's my area and rough timeline: ")}>
              Talk it through with John
            </button>
            <p className="disclaimer-inline">Reaching out doesn't create an agency relationship — representation begins only with a signed written agreement.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ About ============ */
const PILLARS = [
  ['Local market focus', 'The Treasure Valley is the only market I work. When a street starts turning over, I know it.'],
  ['Fast communication', "Calls returned the same day. Deadlines hit early. You'll never wonder where things stand."],
  ['Buyer & seller guidance', 'Both sides of the table, one standard: your interests lead every recommendation.'],
];

function About() {
  return (
    <section className="section" id="about">
      <div className="wrap split">
        <Reveal>
          {/* PLACEHOLDER: replace with John's professional headshot
              (<img src="..." alt="John Spilotros, real estate salesperson" />) */}
          <div className="portrait">
            <span className="portrait-mono">JS</span>
            <span className="portrait-note">Headshot goes here</span>
          </div>
        </Reveal>
        <Reveal className="split-body" delay={0.08}>
          <h2>The agent who treats your move like his own.</h2>
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
  );
}

/* ============ Contact ============ */
function SocialIcon({ name }) {
  const paths = {
    Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" /></>,
    Facebook: <path d="M14 8h2.5V4.5H14c-2.2 0-4 1.8-4 4V11H7.5v3.5H10v6h3.5v-6h2.6l.6-3.5H13.5V8.7c0-.4.3-.7.5-.7Z" />,
    LinkedIn: <><rect x="3" y="9" width="4" height="12" /><circle cx="5" cy="5" r="2" /><path d="M11 9h3.8v1.7A4.2 4.2 0 0 1 18 9c2.8 0 3 2.4 3 4.5V21h-4v-6.4c0-1.2-.4-2.1-1.6-2.1-1.3 0-1.9 1-1.9 2.1V21h-3.5Z" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Contact() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    function onPrefill(e) { setMessage(e.detail || ''); }
    window.addEventListener('prefill-contact', onPrefill);
    return () => window.removeEventListener('prefill-contact', onPrefill);
  }, []);

  const liveSocials = SOCIALS.filter((s) => s.url);

  return (
    <section className="section section-dark" id="contact">
      <div className="wrap contact-grid">
        <Reveal className="contact-lead">
          <h2>Let's talk about your move.</h2>
          <p>One conversation. No pressure, no obligation — just a clear read on your options and a plan you can act on. I respond personally, usually within the business day.</p>
          <div className="contact-direct">
            <a href={'tel:' + PHONE_TEL} className="contact-big">{PHONE_DISPLAY}</a>
            <a href={'mailto:' + LEAD_EMAIL} className="contact-mid">{LEAD_EMAIL}</a>
            <p className="contact-hours">{OFFICE_HOURS} — evenings &amp; weekends by appointment</p>
            <p className="contact-office">Keller Williams Boise · {OFFICE_ADDRESS}</p>
            {liveSocials.length > 0 ? (
              <div className="socials">
                {liveSocials.map((s) => (
                  <a key={s.name} href={s.url} target="_blank" rel="noreferrer" aria-label={'John on ' + s.name}><SocialIcon name={s.name} /></a>
                ))}
              </div>
            ) : (
              <p className="placeholder-val socials-note">[Social links: paste URLs into src/data/site.js]</p>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="tool tool-on-dark">
            <LeadForm
              subject="New message from your website"
              toastMsg="Message sent. Talk soon."
              successMsg="Got it — your message is on its way and you'll hear back from me personally, usually within one business day."
              submitLabel="Start the Conversation"
              submitClass="btn btn-gold"
              labels={{ name: 'Name', email: 'Email', phone: 'Phone', interest: 'I am', message: 'Message', consent: 'Consent to contact' }}
              disclaimer={<>By submitting, you consent to be contacted by phone, text, or email about your inquiry. Representation begins only with a signed written agreement.</>}
            >
              <div className="form-grid">
                <div><label className="flabel" htmlFor="c-name">Name <span className="req">*</span></label><input className="input" id="c-name" name="name" type="text" placeholder="First & last" required /></div>
                <div><label className="flabel" htmlFor="c-phone">Phone</label><input className="input" id="c-phone" name="phone" type="tel" placeholder="(208) 555-0123" /></div>
                <div className="full"><label className="flabel" htmlFor="c-email">Email <span className="req">*</span></label><input className="input" id="c-email" name="email" type="email" placeholder="you@email.com" required /></div>
                <div className="full">
                  <label className="flabel" htmlFor="c-interest">I'm looking to</label>
                  <select className="select" id="c-interest" name="interest" defaultValue="Buy a home">
                    <option>Buy a home</option>
                    <option>Sell a home</option>
                    <option>Buy and sell</option>
                    <option>Relocate to the Treasure Valley</option>
                    <option>Ask a question</option>
                  </select>
                </div>
                <div className="full">
                  <label className="flabel" htmlFor="c-message">Message <span className="req">*</span></label>
                  <textarea className="textarea" id="c-message" name="message" placeholder="Your timeline, your must-haves, or the question on your mind." required value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
              </div>
              <label className="form-note">
                <input type="checkbox" name="consent" required />
                <span>John Spilotros may contact me about real estate services. Submitting this form doesn't create an agency or brokerage relationship. <span className="req">*</span></span>
              </label>
            </LeadForm>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <VideoHero />
      <SearchPreview />
      <Neighborhoods />
      <Buyers />
      <Sellers />
      <About />
      <Contact />
    </>
  );
}
