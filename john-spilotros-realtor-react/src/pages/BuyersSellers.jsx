import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import CountUp from '../bits/CountUp.jsx';
import Magnet from '../bits/Magnet.jsx';

const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

function MortgageTool() {
  const [price, setPrice] = useState(525000);
  const [down, setDown] = useState(105000);
  const [rate, setRate] = useState(6.75);
  const [term, setTerm] = useState(30);

  /* restore last-used values */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('js-mortgage') || 'null');
      if (saved) {
        if (saved.price) setPrice(saved.price);
        if (saved.down) setDown(saved.down);
        if (saved.rate) setRate(saved.rate);
        if (saved.term) setTerm(saved.term);
      }
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('js-mortgage', JSON.stringify({ price, down, rate, term })); } catch (e) { /* ignore */ }
  }, [price, down, rate, term]);

  const loan = Math.max(price - down, 0);
  const r = rate / 100 / 12;
  const n = term * 12;
  const monthly = r === 0 ? loan / n : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const downPct = price > 0 ? Math.round((down / price) * 100) + '%' : '0%';

  return (
    <div className="tool" aria-label="Monthly payment estimator">
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M7 15h2m4 0h4" /></svg>
        Estimate a monthly payment
      </h3>
      <div className="field">
        <div className="field-row"><label htmlFor="m-price">Home price</label><span className="field-val"><CountUp value={price} format={money} /></span></div>
        <input id="m-price" type="range" min="150000" max="1500000" step="5000" value={price} aria-valuetext={money(price)} onChange={(e) => setPrice(+e.target.value)} />
      </div>
      <div className="field">
        <div className="field-row"><label htmlFor="m-down">Down payment</label><span className="field-val"><CountUp value={down} format={money} /></span></div>
        <input id="m-down" type="range" min="0" max="600000" step="5000" value={down} aria-valuetext={money(down) + ' (' + downPct + ' down)'} onChange={(e) => setDown(+e.target.value)} />
        <p className="field-hint"><span>{downPct}</span> of the home price</p>
      </div>
      <div className="field">
        <div className="field-row"><label htmlFor="m-rate">Interest rate</label><span className="field-val">{rate.toFixed(2)}%</span></div>
        <input id="m-rate" type="range" min="3" max="9" step="0.05" value={rate} aria-valuetext={rate.toFixed(2) + '%'} onChange={(e) => setRate(+e.target.value)} />
      </div>
      <div className="field">
        <div className="field-row"><label htmlFor="m-term">Loan term</label><span className="field-val">{term} yr</span></div>
        <input id="m-term" type="range" min="10" max="30" step="5" value={term} aria-valuetext={term + ' years'} onChange={(e) => setTerm(+e.target.value)} />
      </div>
      <div className="calc-result">
        <div className="calc-amount"><CountUp value={monthly || 0} format={money} /></div>
        <div className="calc-label">Estimated monthly payment · principal &amp; interest</div>
        <div className="calc-breakdown">
          <span>Loan amount <strong><CountUp value={loan} format={money} /></strong></span>
          <span>Down <strong>{downPct}</strong></span>
        </div>
      </div>
      <p className="disclaimer-inline">This estimates principal and interest only. It excludes property taxes, homeowner's insurance, HOA dues, and mortgage insurance. It is for illustration only and is not a loan offer, quote, or commitment to lend. For real rates and terms, talk with a licensed mortgage lender.</p>
    </div>
  );
}

export default function BuyersSellers() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Buyers &amp; Sellers</p>
          <h1>Two sides of the same move, handled right.</h1>
          <p>Whether you're buying, selling, or doing both at once, here's how we make it smooth — plus tools to run your own numbers.</p>
        </div>
      </section>

      <section className="section" id="buyers">
        <Reveal className="wrap split">
          <div className="split-body">
            <p className="kicker">For buyers</p>
            <h2>Find the right home, and win it.</h2>
            <p>Buying a home in a competitive valley takes more than browsing listings. I help you move quickly and smartly when the right place comes up.</p>
            <ul className="stack" style={{ listStyle: 'none', marginTop: '1.6rem' }}>
              <li>✦ A search built around your must-haves and your budget</li>
              <li>✦ An honest take on every home, including the ones to walk away from</li>
              <li>✦ Strong, well-structured offers that compete without overpaying</li>
              <li>✦ Steady guidance from inspection all the way to closing</li>
            </ul>
          </div>
          <MortgageTool />
        </Reveal>
      </section>

      <section className="section" id="sellers" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
        <Reveal className="wrap split reverse">
          <div className="split-body">
            <p className="kicker">For sellers</p>
            <h2>Price it right, market it well, close it clean.</h2>
            <p>Selling is part strategy, part presentation, part negotiation. I handle all three so your home draws the right buyers and the right number.</p>
            <ul className="stack" style={{ listStyle: 'none', marginTop: '1.6rem' }}>
              <li>✦ A pricing strategy grounded in real, recent comparable sales</li>
              <li>✦ Preparation and staging advice so your home shows its best</li>
              <li>✦ Marketing that puts your home in front of real, ready buyers</li>
              <li>✦ Negotiation focused on your bottom line and your timeline</li>
            </ul>
          </div>
          <div className="split-media">
            <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80" alt="A well-kept modern home framed by greenery, ready for showings." />
          </div>
        </Reveal>
      </section>

      <section className="cta-band">
        <Reveal className="wrap">
          <h2>Not sure where to start?</h2>
          <p>That's completely normal. Reach out and we'll figure out the right first step together, on your timeline.</p>
          <div className="cta-actions">
            <Magnet><Link className="btn btn-accent" to="/contact">Get in touch <span className="arrow">→</span></Link></Magnet>
            <Magnet><Link className="btn btn-on-dark" to="/about">More about John</Link></Magnet>
          </div>
        </Reveal>
      </section>
    </>
  );
}
