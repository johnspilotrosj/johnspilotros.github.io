import { useState } from 'react';
import { LEAD_EMAIL, LEAD_ENDPOINT, PHONE_DISPLAY, PHONE_TEL } from '../data/site.js';
import { toast } from './Toast.jsx';

/* Shared lead-capture behavior: honeypot, native validation, delivery via
   LEAD_ENDPOINT (Formspree/Netlify) with a pre-filled mailto fallback so a
   lead is never silently lost, then a success state + toast. */
export default function LeadForm({ subject, toastMsg, successMsg, labels = {}, submitLabel, submitClass = 'btn btn-accent', disclaimer, children }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function deliverByEmail(lines) {
    window.location.href =
      'mailto:' + LEAD_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const hp = form.elements.company_website;
    const hp2 = form.elements._gotcha;
    if ((hp && hp.value) || (hp2 && hp2.value)) return; /* honeypot: silently drop bots */
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const fd = new FormData(form);
    const lines = [];
    for (const [name, value] of fd.entries()) {
      if (name === 'company_website' || name === '_gotcha' || !value) continue;
      lines.push((labels[name] || name) + ': ' + (value === 'on' ? 'Yes' : value));
    }

    function finish() { setDone(true); toast(toastMsg); }

    if (LEAD_ENDPOINT) {
      setBusy(true);
      fetch(LEAD_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then((r) => { if (!r.ok) throw new Error('bad'); finish(); })
        .catch(() => { deliverByEmail(lines); finish(); })
        .finally(() => setBusy(false));
    } else {
      deliverByEmail(lines);
      finish();
    }
  }

  if (done) {
    return (
      <div className="form-success show" tabIndex={-1} role="status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        <div className="form-success-body">
          <p className="form-success-title">Message received</p>
          <p>{successMsg}</p>
          <p className="form-success-direct">Need me sooner? Call or text <a href={'tel:' + PHONE_TEL}>{PHONE_DISPLAY}</a>.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <input className="hp-field" type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input className="hp-field" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {children}
      <button className={submitClass} type="submit" disabled={busy} style={{ marginTop: '1.4rem', width: '100%' }}>
        {submitLabel} <span className="arrow">→</span>
      </button>
      {disclaimer && <p className="disclaimer-inline">{disclaimer}</p>}
    </form>
  );
}
