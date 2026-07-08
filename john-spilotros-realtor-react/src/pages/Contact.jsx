import { useEffect, useState } from 'react';
import Reveal from '../bits/Reveal.jsx';
import LeadForm from '../components/LeadForm.jsx';
import { PHONE_DISPLAY, PHONE_TEL, LEAD_EMAIL, SOCIALS, OFFICE_ADDRESS, OFFICE_HOURS } from '../data/site.js';

function SocialIcon({ name }) {
  const paths = {
    Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" /></>,
    Facebook: <path d="M14 8h2.5V4.5H14c-2.2 0-4 1.8-4 4V11H7.5v3.5H10v6h3.5v-6h2.6l.6-3.5H13.5V8.7c0-.4.3-.7.5-.7Z" />,
    LinkedIn: <><rect x="3" y="9" width="4" height="12" /><circle cx="5" cy="5" r="2" /><path d="M11 9h3.8v1.7A4.2 4.2 0 0 1 18 9c2.8 0 3 2.4 3 4.5V21h-4v-6.4c0-1.2-.4-2.1-1.6-2.1-1.3 0-1.9 1-1.9 2.1V21h-3.5Z" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Contact() {
  const [message, setMessage] = useState('');

  /* pick up a message pre-written by a card on the Home page */
  useEffect(() => {
    try {
      const pre = sessionStorage.getItem('prefill-contact');
      if (pre) { setMessage(pre); sessionStorage.removeItem('prefill-contact'); }
    } catch (e) { /* private mode */ }
  }, []);

  const liveSocials = SOCIALS.filter((s) => s.url);

  return (
    <section className="section section-dark page-top" id="contact">
      <div className="wrap contact-grid">
        <Reveal className="contact-lead">
          <h1>Let's talk about your move.</h1>
          <p>One conversation. No pressure, no obligation — just a clear read on your options and a plan you can act on. I respond personally, usually within the business day.</p>
          <div className="contact-direct">
            <a href={'tel:' + PHONE_TEL} className="contact-big">{PHONE_DISPLAY}</a>
            <a href={'mailto:' + LEAD_EMAIL} className="contact-mid">{LEAD_EMAIL}</a>
            <p className="contact-hours">{OFFICE_HOURS} — evenings &amp; weekends by appointment</p>
            <p className="contact-office">Keller Williams Boise · {OFFICE_ADDRESS}</p>
            <span className="kw-chip"><img src="/kw-mark.svg" alt="Keller Williams" /></span>
            {liveSocials.length > 0 && (
              <div className="socials">
                {liveSocials.map((s) => (
                  <a key={s.name} href={s.url} target="_blank" rel="noreferrer" aria-label={'John on ' + s.name}><SocialIcon name={s.name} /></a>
                ))}
              </div>
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
