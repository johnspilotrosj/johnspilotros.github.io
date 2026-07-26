import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import Faq from '../components/Faq.jsx';
import { prefillContact } from '../data/prefill.js';

const STEPS = [
  ['Get pre-approved', "Know your budget before you start touring. I'll connect you with local lenders who move fast, and a pre-approval letter makes your offer real. Sellers read it first."],
  ['Sign a buyer agreement', "Before we tour homes together, the rules require a written buyer representation agreement. It spells out exactly what I do for you and what it costs, in plain language, before you commit to anything. I'll walk you through every line."],
  ['Tour homes', "We tour the homes worth seeing, and I'll give you my honest take on every one of them. The right home usually shows up in week two or three. Be ready to move."],
  ['Make the offer', "Price, terms, and timing built around what the seller actually cares about. The highest number doesn't always win. The cleanest offer often does."],
  ['Inspection & appraisal', 'I manage the deadlines, the negotiations, and the repair requests. This is where a lot of deals fall apart. I keep yours on track and you stay in control.'],
  ['Closing day', "Signatures, keys, done. Average time from accepted offer to keys is about 30 days. And I'm still around if you need anything after you move in."],
];

const COSTS = [
  ['Earnest money', "A deposit that shows the seller you're serious, often around one percent of the price. It's not an extra cost. It counts toward what you pay at closing, and the contract spells out when you'd get it back."],
  ['Inspection', "A few hundred dollars, paid when it happens. The best money you spend in the whole process. It tells you what you're actually buying."],
  ['Appraisal', "Your lender orders it and you usually pay for it with your loan costs. It protects you from overpaying."],
  ['Closing costs', 'Loan fees, title, and escrow usually land around two to three percent of the price. Idaho has no transfer tax, which keeps this cheaper than a lot of states. Your lender gives you the exact numbers up front.'],
];

const FAQ_ITEMS = [
  ['Do I need 20 percent down?', 'No. Plenty of buyers put down far less. Conventional loans go as low as 3 percent down, FHA is 3.5, VA is zero for veterans, and USDA is zero in some rural parts of the valley. Twenty percent avoids mortgage insurance, but waiting years to save it often costs more than the insurance would.'],
  ['How long does buying take?', 'From accepted offer to keys is usually around 30 days. How long it takes to find the right home is the variable part. Some buyers find it the first weekend, most take a few weeks.'],
  ['Who pays my agent?', "Commissions are negotiable and not set by law. Sometimes the seller offers to cover some or all of the buyer's agent fee, sometimes not. Whatever the arrangement, it's written into the buyer agreement before we tour a single home, so there are no surprises."],
  ['Should I wait for prices to drop?', "I won't pretend to know where prices go next, and neither does anyone else. What I can tell you is what homes are selling for right now, town by town, and help you decide if the payment works for your life. That's the honest version of this answer."],
  ["I'm moving from out of state. Where do I start?", 'Start with the relocation guide on this site, then reach out. I do video tours, handle paperwork electronically, and act as your eyes on the ground so the distance stops being a problem.'],
];

export default function Buy() {
  const navigate = useNavigate();
  function start() {
    prefillContact("I'm looking to buy in the Treasure Valley. Here's my situation: ");
    navigate('/contact');
  }
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <p className="kicker">For buyers</p>
          <h1>Buy a home in the Treasure Valley.</h1>
          <p>One agent from first tour to keys. Here's exactly how it works, what it costs, and the answers most buyers want before they pick up the phone.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head">
            <h2>The process, start to close.</h2>
            <p>Six steps. I run all of them, you make the decisions.</p>
          </Reveal>
          <div className="steps steps-guide">
            {STEPS.map(([title, body], i) => (
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

      <section className="section section-alt">
        <div className="wrap">
          <Reveal className="sec-head">
            <h2>What buying actually costs.</h2>
            <p>Beyond the down payment, here's what to plan for. Typical numbers, and your lender confirms the exact ones before you commit to anything.</p>
          </Reveal>
          <Reveal>
            <dl className="moves">
              {COSTS.map(([t, b]) => (
                <div className="move" key={t}><dt>{t}</dt><dd>{b}</dd></div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <Faq heading="Buyer questions, straight answers." items={FAQ_ITEMS} />

      <section className="section section-dark cta-band">
        <Reveal className="wrap">
          <h2>Ready to look, or just thinking about it?</h2>
          <p>Either is fine. Tell me what you're after and your rough budget, and I'll send you homes that fit, often before they hit the open market.</p>
          <div className="cta-actions">
            <button type="button" className="btn btn-gold" onClick={start}>Start your home search <span className="arrow">→</span></button>
            <Link className="btn btn-glass" to="/relocation">Moving from out of state?</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
