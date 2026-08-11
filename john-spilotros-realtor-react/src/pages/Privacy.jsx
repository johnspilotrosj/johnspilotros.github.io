import Breadcrumbs from '../components/Breadcrumbs.jsx';
import { LEAD_EMAIL, PHONE_DISPLAY, PHONE_TEL, OFFICE_ADDRESS } from '../data/site.js';

export default function Privacy() {
  return (
    <>
      <section className="page-head">
        <div className="wrap">
          <Breadcrumbs current="Privacy Policy" path="/privacy" />
          <p className="kicker">Legal</p>
          <h1>Privacy policy.</h1>
          <p>The plain-language version of what this site collects and what happens to it. Last updated August 2026.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="prose stack legal-prose">
            <h3>What this site collects</h3>
            <p>If you fill out a contact form, I receive what you type: your name, email, phone number if you share it, and your message. That's the only personal information this site asks for. You can also skip the forms entirely and just call or text.</p>

            <h3>How it's used</h3>
            <p>Form submissions come straight to me, John Spilotros, and I use them for one thing: responding to your inquiry about real estate. I don't sell your information, rent it out, or add you to mailing lists you didn't ask for.</p>

            <h3>Services this site relies on</h3>
            <p>A few third-party services make the site work, and each may process limited data in the course of doing its job:</p>
            <p><strong>Formspree</strong> delivers contact form submissions to my email. <strong>Google Analytics</strong> may collect anonymous usage data, like which pages get visited, to help me understand how people use the site; it uses cookies and you can block them in your browser without breaking anything. <strong>Google Fonts</strong> serves the site's typefaces. <strong>GitHub Pages</strong> hosts the site and, like any web host, keeps standard server logs.</p>

            <h3>Cookies</h3>
            <p>This site doesn't set cookies of its own. Google Analytics, if active, sets its standard analytics cookies. No advertising or tracking-for-ads cookies are used.</p>

            <h3>Your choices</h3>
            <p>Want to know what I have from you, or want it deleted? Email me at <a href={'mailto:' + LEAD_EMAIL}>{LEAD_EMAIL}</a> or call <a href={'tel:' + PHONE_TEL}>{PHONE_DISPLAY}</a> and I'll take care of it. No forms, no hoops.</p>

            <h3>Contact</h3>
            <p>John Spilotros, Licensed Idaho Real Estate Salesperson<br />
              Keller Williams Realty Boise · {OFFICE_ADDRESS}<br />
              <a href={'mailto:' + LEAD_EMAIL}>{LEAD_EMAIL}</a> · <a href={'tel:' + PHONE_TEL}>{PHONE_DISPLAY}</a></p>
          </div>
        </div>
      </section>
    </>
  );
}
