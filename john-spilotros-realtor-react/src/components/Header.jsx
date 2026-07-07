import { useEffect, useState } from 'react';

const LINKS = [
  { to: '#search', label: 'Search' },
  { to: '#neighborhoods', label: 'Neighborhoods' },
  { to: '#buyers', label: 'Buyers' },
  { to: '#sellers', label: 'Sellers' },
  { to: '#about', label: 'About' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={'site-header' + (scrolled ? ' scrolled' : '')}>
        <div className="wrap header-inner">
          <a className="brand" href="#top" aria-label="John Spilotros, back to top">
            <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="38" height="38" rx="4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M11 27.5 20 13.5 29 27.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M20 15v12.5" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="brand-text">
              <span className="brand-name">John Spilotros</span>
              <span className="brand-sub">Boise · Treasure Valley</span>
            </span>
          </a>
          <nav className="nav" aria-label="Primary">
            <ul className="nav-links">
              {LINKS.map((l) => (
                <li key={l.to}><a href={l.to} onClick={() => setOpen(false)}>{l.label}</a></li>
              ))}
            </ul>
            <span className="nav-cta"><a className="btn btn-gold" href="#contact">Book a Consultation</a></span>
            <button
              className="nav-toggle"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen(!open)}
            ><span></span></button>
          </nav>
        </div>
      </header>
      <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile">
        {LINKS.map((l) => (
          <a key={l.to} href={l.to} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a className="btn btn-gold" href="#contact" onClick={() => setOpen(false)}>Book a Consultation</a>
      </nav>
    </>
  );
}
