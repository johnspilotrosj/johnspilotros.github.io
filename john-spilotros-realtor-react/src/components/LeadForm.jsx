import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEAD_EMAIL, LEAD_ENDPOINT } from '../data/site.js';
import { toast } from './Toast.jsx';

/* Shared lead-capture behavior: honeypot, native validation, delivery via
   LEAD_ENDPOINT (Formspree/Netlify) with a pre-filled mailto fallback so a
   lead is never silently lost, then a toast + the /thank-you page (which
   doubles as the analytics conversion page). */
export default function LeadForm({ subject, toastMsg, labels = {}, submitLabel, submitClass = 'btn btn-accent', disclaimer, children }) {
  const navigate = useNavigate();
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

    function finish() { toast(toastMsg); navigate('/thank-you'); }

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
