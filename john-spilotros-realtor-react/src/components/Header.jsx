import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const onHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* Over the video hero the header is transparent white-on-dark; on light
     pages (or once scrolled) it becomes the porcelain glass bar. */
  const solid = scrolled || !onHome;

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={'site-header' + (solid ? ' scrolled' : '')}>
        <div className="wrap header-inner">
          <Link className="brand" to="/" aria-label="John Spilotros, home">
            <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="38" height="38" rx="4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M11 27.5 20 13.5 29 27.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M20 15v12.5" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="brand-text">
              <span className="brand-name">John Spilotros</span>
              <span className="brand-sub">Boise · Treasure Valley</span>
            </span>
          </Link>
          <nav className="nav" aria-label="Primary">
            <ul className="nav-links">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} end={l.to === '/'}>{l.label}</NavLink>
                </li>
              ))}
            </ul>
            <span className="nav-cta"><Link className="btn btn-gold" to="/contact">Book a Consultation</Link></span>
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
          <NavLink key={l.to} to={l.to} end={l.to === '/'}>{l.label}</NavLink>
        ))}
        <Link className="btn btn-gold" to="/contact">Book a Consultation</Link>
      </nav>
    </>
  );
}
