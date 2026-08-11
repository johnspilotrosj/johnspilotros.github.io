import { Link } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/site.js';

/* Landing page after a lead form submits. Doubles as the conversion page
   for Google Analytics goals. Noindexed via meta.js. */
export default function ThankYou() {
  return (
    <section className="page-head thankyou">
      <div className="wrap">
        <Breadcrumbs current="Thank You" path="/thank-you" />
        <p className="kicker">Message received</p>
        <h1>Thank you. It's in my inbox.</h1>
        <p>I read every message personally and you'll hear back from me within one business day, usually much sooner. If it's time-sensitive, skip the wait and call or text <a href={'tel:' + PHONE_TEL}>{PHONE_DISPLAY}</a>.</p>
        <Reveal>
          <div className="thankyou-next">
            <h2>While you wait</h2>
            <ul>
              <li><Link to="/buy">How buying works here, costs included</Link></li>
              <li><Link to="/sell">How I run a home sale, start to finish</Link></li>
              <li><Link to="/relocation">Moving from out of state? Start here</Link></li>
              <li><Link to="/">Browse the Treasure Valley town guides</Link></li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
