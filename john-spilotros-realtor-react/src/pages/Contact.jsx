import { useEffect, useState } from 'react';
import Reveal from '../bits/Reveal.jsx';
import LeadForm from '../components/LeadForm.jsx';
import { PHONE_DISPLAY, PHONE_TEL, LEAD_EMAIL, OFFICE_ADDRESS_PLACEHOLDER } from '../data/site.js';

const AREAS = ['Boise', 'Meridian', 'Eagle', 'Nampa', 'Kuna', 'Star', 'Caldwell', 'Garden City'];

export default function Contact() {
  const [message, setMessage] = useState('');

  /* prefill from a listing "Inquire" hand-off */
  useEffect(() => {
    try {
      const li = sessionStorage.getItem('inquiry-listing');
      if (li) {
        setMessage("I'm interested in " + li + '. Could you send me more details and let me know about a showing?');
        sessionStorage.removeItem('inquiry-listing');
      }
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Contact</p>
          <h1>Let's talk about your move.</h1>
          <p>Call, email, or send a note below — whatever's easiest. You'll hear back from me personally, usually within one business day.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap contact-grid">
          <Reveal>
            <LeadForm
              subject="New message from your website"
              toastMsg="Thanks for reaching out! I'll be in touch shortly."
              successMsg="Thanks for reaching out. Your message is on its way and I'll get back to you personally, usually within one business day."
              submitLabel="Send message"
              submitClass="btn"
              labels={{ name: 'Your name', phone: 'Phone', email: 'Email', interest: 'Reaching out about', message: 'Message', consent: 'Consent to contact' }}
              disclaimer={<>By submitting, you consent to be contacted by phone, text, or email about your inquiry. Representation begins only with a signed written agreement. Please don't include confidential or financial details in this form.</>}
            >
              <div className="form-grid">
                <div><label className="flabel" htmlFor="c-name">Your name <span className="req">*</span></label><input className="input" id="c-name" name="name" type="text" placeholder="First & last" required /></div>
                <div><label className="flabel" htmlFor="c-phone">Phone</label><input className="input" id="c-phone" name="phone" type="tel" placeholder="(208) 555-0123" /></div>
                <div className="full"><label className="flabel" htmlFor="c-email">Email <span className="req">*</span></label><input className="input" id="c-email" name="email" type="email" placeholder="you@email.com" required /></div>
                <div className="full">
                  <label className="flabel" htmlFor="c-interest">I'm reaching out about</label>
                  <select className="select" id="c-interest" name="interest" defaultValue="Buying a home">
                    <option>Buying a home</option>
                    <option>Selling a home</option>
                    <option>Relocating to the Treasure Valley</option>
                    <option>I just have a question</option>
                  </select>
                </div>
                <div className="full">
                  <label className="flabel" htmlFor="c-message">How can I help? <span className="req">*</span></label>
                  <textarea className="textarea" id="c-message" name="message" placeholder="A few details about what you're looking for, your timeline, or anything you're wondering about." required value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
              </div>
              <label className="form-note">
                <input type="checkbox" name="consent" required />
                <span>I agree John Spilotros may contact me about real estate services. I understand that submitting this form does not create an agency or brokerage relationship. <span className="req">*</span></span>
              </label>
            </LeadForm>
          </Reveal>

          <Reveal className="contact-aside" delay={0.1}>
            <div className="contact-card">
              <h3>Reach me directly</h3>
              <div className="contact-line">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
                <a href={'tel:' + PHONE_TEL}>{PHONE_DISPLAY}</a>
              </div>
              <div className="contact-line">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
                <a href={'mailto:' + LEAD_EMAIL}>{LEAD_EMAIL}</a>
              </div>
              <div className="contact-line">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <span>Keller Williams Boise<br /><span className="placeholder-val">{OFFICE_ADDRESS_PLACEHOLDER}</span></span>
              </div>
            </div>

            <div className="contact-card">
              <h3>Office hours</h3>
              <div className="contact-line" style={{ marginBottom: '0.4rem' }}><span>Mon–Fri &nbsp;·&nbsp; 8am to 6pm</span></div>
              <div className="contact-line" style={{ marginBottom: '0.4rem' }}><span>Saturday &nbsp;·&nbsp; By appointment</span></div>
              <div className="contact-line"><span>Sunday &nbsp;·&nbsp; Closed</span></div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.6rem' }}>Evenings and weekends are often available for showings, just ask.</p>
            </div>

            <div className="contact-card">
              <h3>Where I work</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Serving buyers and sellers across Boise and the wider Treasure Valley.</p>
              <div className="area-pills">
                {AREAS.map((a) => <span key={a}>{a}</span>)}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
