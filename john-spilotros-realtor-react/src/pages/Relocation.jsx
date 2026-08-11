import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import Faq from '../components/Faq.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { NEIGHBORHOODS } from '../data/site.js';
import { prefillContact } from '../data/prefill.js';

const REMOTE = [
  ['Video tours, live', "I walk every home with my phone up and you on the line. You see the street, hear the road noise, and ask me to open every closet. My honest take included, same as if you were standing next to me."],
  ['Your eyes on the ground', 'Neighborhood drive-bys, commute checks at rush hour, a look at that lot line you were wondering about. Things a listing photo will never show you.'],
  ['Everything signed electronically', 'Offers, disclosures, and closing paperwork are all handled digitally. People buy homes here from out of state every week without flying in. You can too.'],
  ['One point of contact', "Lender, inspector, title, movers. I coordinate all of it so you're not managing a project from three time zones away."],
];

const FAQ_ITEMS = [
  ['Can I really buy a home without visiting?', "Yes, it happens all the time and I'm set up for it: live video tours, electronic signing, and me as your eyes on the ground. That said, if you can make one trip to feel out the towns, it's worth it, and I'll build the visit so you see the most in the least time."],
  ['Which town should I look at?', "Depends on what your life looks like. Boise for walkability and character, Meridian for schools and master-planned neighborhoods, Eagle for room and custom homes, Nampa and Kuna for value, Star for acreage, Garden City for the creative streak. The town guides on this site give you the honest version of each, and I'll go deeper on a call."],
  ['How fast can it happen?', "Once you're pre-approved and we find the home, about 30 days from accepted offer to keys. The searching part depends on the market and your list. Some relocations wrap up in a month, most take two or three."],
  ['Should I rent first?', "Sometimes, honestly, yes. If you've never spent time here, six months of renting teaches you which part of the valley fits before you commit. If you already know where you're headed, buying straight away saves you a second move. I'll give you my read either way, and I don't earn anything by steering you wrong."],
  ['What should I know before moving to Idaho?', "Four real seasons including actual winter, summers that are hot and dry, and outdoor access most states can't touch. The valley has grown fast, so traffic is real but mild by big-city standards. Come see it before the secret gets any further out."],
];

export default function Relocation() {
  const navigate = useNavigate();
  function start() {
    prefillContact("I'm relocating to the Treasure Valley. Here's where I'm coming from and my rough timeline: ");
    navigate('/contact');
  }
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <Breadcrumbs current="Relocation" path="/relocation" />
          <p className="kicker">Relocation</p>
          <h1>Moving to the Treasure Valley.</h1>
          <p>Thousands of people move to the Boise area every year, and most of them start the search from another state. That distance is exactly what I'm set up to handle.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="sec-head">
            <h2>Buying from out of state, handled.</h2>
            <p>You don't need to be here. Here's how it works when you're not.</p>
          </Reveal>
          <Reveal>
            <dl className="moves">
              {REMOTE.map(([t, b]) => (
                <div className="move" key={t}><dt>{t}</dt><dd>{b}</dd></div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <Reveal className="sec-head">
            <h2>Where people land.</h2>
            <p>Seven towns, each with its own feel and price point. Every one has a full guide on this site.</p>
          </Reveal>
          <Reveal>
            <div className="reloc-towns">
              {NEIGHBORHOODS.map((n) => (
                <Link key={n.slug} className="reloc-town" to={'/' + n.slug}>
                  <span className="reloc-town-name">{n.name}</span>
                  <span className="reloc-town-price">{n.price} median</span>
                  <span className="reloc-town-desc">{n.desc}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Faq heading="Relocation questions, straight answers." items={FAQ_ITEMS} />

      <section className="section section-dark cta-band">
        <Reveal className="wrap">
          <h2>Tell me where you're coming from.</h2>
          <p>Your timeline, your budget, and what your week looks like. I'll tell you which towns to look at and send homes that fit, and we'll take it from there.</p>
          <div className="cta-actions">
            <button type="button" className="btn btn-gold" onClick={start}>Start the conversation <span className="arrow">→</span></button>
            <Link className="btn btn-glass" to="/buy">See how buying works</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
