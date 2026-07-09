import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../bits/Reveal.jsx';
import Magnet from '../bits/Magnet.jsx';
import TiltedCard from '../bits/TiltedCard.jsx';
import { isConfigured, fetchListings } from '../data/supabase.js';

function statusClass(status) {
  return 'st-' + String(status || 'For Sale').toLowerCase().replace(/[^a-z]+/g, '-');
}

function EmptyState() {
  return (
    <div className="listings-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5h5v5" /></svg>
      <h3>New listings are on the way.</h3>
      <p>I'm lining up homes across Boise and the Treasure Valley right now. Looking for something specific? Tell me what you're after and I'll send you matching homes&nbsp;— often before they hit the open market.</p>
      <Link className="btn btn-gold" to="/contact">Tell me what you're looking for <span className="arrow">→</span></Link>
    </div>
  );
}

function ListingModal({ listing, onClose }) {
  const navigate = useNavigate();
  const closeRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('modal-open');
    closeRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!listing) return null;
  const photos = (listing.photos || []).filter(Boolean);
  const alt = (listing.address || '') + (listing.city ? ', ' + listing.city : '');
  const specs = [
    listing.beds && [listing.beds, 'Beds'],
    listing.baths && [listing.baths, 'Baths'],
    listing.sqft && [Number(listing.sqft).toLocaleString('en-US'), 'Sq Ft'],
    listing.lot && [listing.lot, 'Lot'],
    listing.year_built && [listing.year_built, 'Built'],
  ].filter(Boolean);

  function inquire() {
    try { sessionStorage.setItem('inquiry-listing', alt); } catch (e) { /* ignore */ }
    onClose();
    navigate('/contact');
  }

  return (
    <div className="listing-modal open" role="dialog" aria-modal="true" aria-label={alt || 'Listing details'}>
      <div className="listing-modal-backdrop" onClick={onClose}></div>
      <div className="listing-modal-panel" role="document">
        <button ref={closeRef} className="listing-modal-close" type="button" aria-label="Close" onClick={onClose}>&times;</button>
        <div className="listing-modal-content">
          <div className="lm-head">
            <span className={'listing-badge ' + statusClass(listing.status)}>{listing.status || 'For Sale'}</span>
            <div className="lm-price">{listing.price || 'Call for price'}</div>
            <h2>{listing.address || ''}</h2>
            {listing.city && <p className="lm-city">{listing.city}{listing.mls ? ' · MLS ' + listing.mls : ''}</p>}
          </div>
          {specs.length > 0 && (
            <div className="lm-specs">
              {specs.map(([v, l]) => <div key={l}><span>{v}</span>{l}</div>)}
            </div>
          )}
          {photos.length > 0 && (
            <div className="lm-gallery">
              {photos.map((p, i) => (
                <img key={p} loading="lazy" src={p} alt={(listing.address || 'Listing') + ' photo ' + (i + 1)} />
              ))}
            </div>
          )}
          {listing.description && (
            <div className="lm-desc">
              {String(listing.description).split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}
          <div className="lm-actions">
            <button className="btn btn-gold" type="button" onClick={inquire}>Inquire about this home <span className="arrow">→</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing, onView, onInquire }) {
  const photos = (listing.photos || []).filter(Boolean);
  const alt = (listing.address || '') + (listing.city ? ', ' + listing.city : '');
  return (
    <TiltedCard max={5} scale={1.01}>
      <article className="listing-card">
        <div className="listing-media">
          {photos[0]
            ? <img loading="lazy" src={photos[0]} alt={alt} />
            : <div className="listing-noimg" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" /></svg></div>}
          <span className={'listing-badge ' + statusClass(listing.status)}>{listing.status || 'For Sale'}</span>
          {photos.length > 1 && <span className="listing-count">{photos.length} photos</span>}
        </div>
        <div className="listing-body">
          <div className="listing-price">{listing.price || 'Call for price'}</div>
          <div className="listing-addr">{listing.address || ''}</div>
          {listing.city && <div className="listing-city">{listing.city}{listing.mls ? ' · MLS ' + listing.mls : ''}</div>}
          <div className="listing-specs">
            {listing.beds && <span><strong>{listing.beds}</strong> bd</span>}
            {listing.baths && <span><strong>{listing.baths}</strong> ba</span>}
            {listing.sqft && <span><strong>{Number(listing.sqft).toLocaleString('en-US')}</strong> sqft</span>}
          </div>
          <div className="listing-actions">
            <button type="button" className="btn btn-line" onClick={onView}>View details</button>
            <button type="button" className="btn btn-gold" onClick={onInquire}>Inquire</button>
          </div>
        </div>
      </article>
    </TiltedCard>
  );
}

export default function Listings() {
  const [items, setItems] = useState(null); /* null = loading, [] = none */
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const source = isConfigured()
      ? fetchListings().then((rows) => ({ listings: rows }))
      : fetch('data/listings.json', { cache: 'no-cache' })
          .then((r) => { if (!r.ok) throw new Error('bad'); return r.json(); });
    source
      .then((data) => {
        const list = (data && data.listings ? data.listings : []).filter(
          (l) => l && (l.address || l.price || (l.photos && l.photos.length))
        );
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        setItems(list);
      })
      .catch(() => setItems([]));
  }, []);

  function inquire(listing) {
    const alt = (listing.address || '') + (listing.city ? ', ' + listing.city : '');
    try { sessionStorage.setItem('inquiry-listing', alt); } catch (e) { /* ignore */ }
    navigate('/contact');
  }

  return (
    <>
      <section className="section page-head">
        <div className="wrap">
          <p className="kicker">Listings</p>
          <h1>Homes for sale across the Treasure Valley.</h1>
          <p>Browse current listings below. Looking for something specific, or want to see homes the moment they hit the market? Tell me what you're after and I'll set up a personal search for you.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal>
            {items && items.length > 0 ? (
              <div className="listings-grid">
                {items.map((l, i) => (
                  <ListingCard key={(l.address || '') + i} listing={l} onView={() => setSelected(l)} onInquire={() => inquire(l)} />
                ))}
              </div>
            ) : (
              <div className="listings-grid is-empty">{items !== null && <EmptyState />}</div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section section-dark cta-band">
        <Reveal className="wrap">
          <h2>Don't see the one yet?</h2>
          <p>The right home isn't always on a public list. Tell me your must-haves and your budget, and I'll do the hunting&nbsp;— including off-market and coming-soon homes across the valley.</p>
          <div className="cta-actions">
            <Magnet><Link className="btn btn-gold" to="/contact">Start your search <span className="arrow">→</span></Link></Magnet>
            <Magnet><Link className="btn btn-glass" to="/about">About John</Link></Magnet>
          </div>
        </Reveal>
      </section>

      {selected && <ListingModal listing={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
