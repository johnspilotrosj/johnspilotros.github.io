import { useNavigate } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import Faq from '../components/Faq.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import CaseStudies from '../components/CaseStudies.jsx';
import { prefillContact } from '../data/prefill.js';

const PHASES = [
  ['Price it right', "We walk your home together, then I price it from real comparable sales in your neighborhood, not wishful thinking. The right number creates competition. The wrong one costs you weeks and leverage."],
  ['Get it ready', "Straight advice on what to fix, what to stage, and what to leave alone. Most homes need less work than owners think. I'll tell you where the money actually comes back."],
  ['Market it properly', "I did digital marketing for years before real estate. Professional photos, a write-up that sells the life and not just the square footage, and real online reach. This is the part most agents outsource and I don't."],
  ['Work the offers', "When offers land, I work the terms as hard as the price. Contingencies, timelines, and financing strength matter as much as the number at the top of the page."],
  ['Close it clean', "Inspection negotiations handled, deadlines met, surprises dealt with before they become problems. Proceeds in your account."],
];

const FAQ_ITEMS = [
  ["What's my home worth?", "The honest answer takes a conversation, not a website widget. I'll pull real comparable sales for your street, walk the home, and give you a number I can defend, at no cost and with no obligation to list."],
  ['What does selling cost?', "Commission is negotiable and not set by law, and we agree on it in writing before anything starts. Beyond that, plan for title and escrow fees and any prep work you choose to do. Idaho has no transfer tax, which works in your favor."],
  ['When is the best time to list?', "Spring and early summer are the busiest in the Treasure Valley, but the best time is when your pricing, prep, and life line up. A well-priced home sells in any month. An overpriced one sits in the best market."],
  ['Do I need to renovate before selling?', "Usually no. Deep cleaning, paint, and fixing the small stuff buyers notice almost always beat a big renovation dollar for dollar. I'll walk your home and tell you exactly where to stop spending."],
  ["What if my home doesn't sell?", "It sells if it's priced to the market. If showings are quiet, the market is telling us something, and I'll tell you what it's saying and what I'd change instead of letting it sit. You'll never be left guessing."],
];

export default function Sell() {
  const navigate = useNavigate();
  function start() {
    prefillContact("I'm thinking about selling my home. Here's my area and rough timeline: ");
    navigate('/contact');
  }
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <Breadcrumbs current="Sell a Home" path="/sell" />
          <p className="kicker">For sellers</p>
          <h1>Sell it well. Not just fast.</h1>
          <p>Your home will sell. The question is for how much, and how smoothly. Here's how I run a sale, what it costs, and the questions every seller asks first.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head">
            <h2>How I run your sale.</h2>
            <p>Five phases, one agent responsible for all of them.</p>
          </Reveal>
          <div className="steps steps-guide">
            {PHASES.map(([title, body], i) => (
              <Reveal key={title} delay={Math.min(i * 0.06, 0.3)}>
                <SpotlightCard className="step">
                  <div className="step-hit">
                    <span className="step-n">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CaseStudies />

      <Faq heading="Seller questions, straight answers." items={FAQ_ITEMS} />

      <section className="section section-dark cta-band">
        <Reveal className="wrap">
          <h2>Thinking about selling?</h2>
          <p>A straightforward conversation about your home, your timing, and what the market is doing in your area. No obligation, just a real answer.</p>
          <div className="cta-actions">
            <button type="button" className="btn btn-gold" onClick={start}>Talk it through with John <span className="arrow">→</span></button>
          </div>
          <p className="disclaimer-inline" style={{ maxWidth: '52ch', margin: '1.4rem auto 0' }}>Reaching out doesn't create an agency relationship. Representation begins only with a signed written agreement.</p>
        </Reveal>
      </section>
    </>
  );
}
