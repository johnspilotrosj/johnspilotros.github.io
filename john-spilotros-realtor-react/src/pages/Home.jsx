import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import SplitText from '../bits/SplitText.jsx';
import Reveal from '../bits/Reveal.jsx';
import Magnet from '../bits/Magnet.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import { HERO_CLIPS, NEIGHBORHOODS } from '../data/site.js';

const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

/* Any card can pre-write a message and send the visitor to the Contact page.
   The message rides in sessionStorage; the Contact page picks it up on mount. */
export function prefillContact(message) {
  try { sessionStorage.setItem('prefill-contact', message); } catch (e) { /* private mode */ }
  window.location.hash = '#/contact';
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
    function prep(v, i) {
      /* iOS Safari: autoplay requires the muted + playsinline ATTRIBUTES in the
         DOM. React sets the muted property but not the attribute, so set both
         by hand — otherwise iPhones refuse to start the reel. */
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.src = clip(i).src;
      v.loop = true;
      v.load();
    }
    function slow(v) { try { v.playbackRate = 0.55; } catch (e) { /* older browsers */ } }
    function roll(v) {
      slow(v);
      /* iOS resets playbackRate when playback actually starts; re-assert it */
      v.addEventListener('playing', () => slow(v), { once: true });
      const p = v.play();
      if (p && p.catch) {
        p.catch(() => {
          /* Autoplay refused (iOS Low Power Mode, data saver): keep the charcoal
             base and retry once on the visitor's first touch — no play button ever. */
          const retry = () => { v.play().catch(() => {}); };
          window.addEventListener('touchstart', retry, { once: true, passive: true });
          window.addEventListener('pointerdown', retry, { once: true });
        });
      }
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

    /* background tab at load: hold the charcoal base, start the reel on first view */
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
          <Magnet><button type="button" className="btn btn-gold" onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}>Start Your Home Search</button></Magnet>
          <Magnet><Link className="btn btn-glass" to="/contact">Book a Consultation</Link></Magnet>
        </div>
      </div>
      <button type="button" className="hero-scroll" aria-label="Scroll to home search" onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}>
        <span></span>
      </button>
    </section>
  );
}

/* ============ Listings (coming soon) ============ */
function SearchPreview() {
  return (
    <section className="section" id="search">
      <div className="wrap">
        <Reveal className="sec-head">
          <h2>Find your Treasure Valley home.</h2>
          <p>Tell me your must-haves and your budget, and I'll send you homes that fit across Boise and the valley, often before they hit the open market.</p>
        </Reveal>
        <Reveal>
          <div className="homes-empty">
            <button type="button" className="btn btn-gold" onClick={() => prefillContact("Here's what I'm looking for: ")}>Tell me what you're looking for</button>
          </div>
        </Reveal>
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
          <h2>The Treasure Valley, town by town.</h2>
          <p>Seven cities, each with its own feel. Here's a quick read on every one, and what homes are going for right now.</p>
        </Reveal>
        <div className="hood-grid">
          {NEIGHBORHOODS.map((n, i) => (
            <Reveal key={n.name} delay={Math.min(i * 0.05, 0.3)}>
              <article className="hood-card">
                <div className="hood-media"><img loading="lazy" src={n.img} alt={n.alt} /></div>
                <div className="hood-body">
                  <h3>{n.name}</h3>
                  <p>{n.desc}</p>
                  <p className="hood-price">Median price: <span>{n.price}</span></p>
                  <button type="button" className="link-gold" onClick={() => prefillContact(`Tell me about ${n.name}. What's the market like there right now?`)}>
                    Explore {n.name} →
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="hood-source">Median sale prices: Redfin city market data, May 2026.</p>
      </div>
    </section>
  );
}

/* ============ Buyers ============ */
const BUYER_STEPS = [
  ['Get pre-approved', "Know your budget before you start touring. I'll connect you with local lenders who move fast.", 'A pre-approval letter makes your offer real. Sellers read it first.'],
  ['Tour homes', "We tour the homes worth seeing, and I'll give you my honest take on every one of them.", 'The right home usually shows up in week two or three. Be ready to move.'],
  ['Make the offer', 'Price, terms, and timing built around what the seller actually cares about.', "The highest number doesn't always win. The cleanest offer often does."],
  ['Inspection & appraisal', 'I manage the deadlines, the negotiations, and the repair requests. You stay in control.', 'This is where a lot of deals fall apart. I keep yours on track.'],
  ['Closing day', "Signatures, keys, done. And I'm still around if you need anything after you move in.", 'Average time from accepted offer to keys: about 30 days.'],
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
  ['Marketing', 'Professional presentation and real online reach. I did digital marketing before real estate, so your home gets both.'],
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
          <p className="lead-in">Your home will sell. The question is for how much, and how smoothly. Here's what I focus on:</p>
          <dl className="moves">
            {SELLER_MOVES.map(([t, b]) => (
              <div className="move" key={t}><dt>{t}</dt><dd>{b}</dd></div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="tool">
            <h3>Thinking about selling?</h3>
            <p className="tool-sub">A straightforward conversation about your home, your timing, and what the market is doing in your area. No obligation, just a real answer.</p>
            <button type="button" className="btn btn-gold" style={{ width: '100%' }} onClick={() => prefillContact("I'm thinking about selling my home. Here's my area and rough timeline: ")}>
              Talk it through with John
            </button>
            <p className="disclaimer-inline">Reaching out doesn't create an agency relationship. Representation begins only with a signed written agreement.</p>
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
    </>
  );
}
