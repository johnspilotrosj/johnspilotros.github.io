import Reveal from '../bits/Reveal.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import { TESTIMONIALS, GOOGLE_PROFILE_URL } from '../data/site.js';

/* Real client reviews, pasted word for word into site.js. The section renders
   nothing until there is at least one, same pattern as CaseStudies. */
export default function Testimonials({ alt = false }) {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className={'section' + (alt ? ' section-alt' : '')} id="reviews">
      <div className="wrap">
        <Reveal className="sec-head">
          <h2>What clients say.</h2>
          <p>In their own words, unedited.</p>
        </Reveal>
        <div className="quote-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name + i} delay={Math.min(i * 0.06, 0.3)}>
              <SpotlightCard as="figure" className="quote-card">
                {t.stars > 0 && <span className="quote-stars" role="img" aria-label={t.stars + ' out of 5 stars'}>{'★'.repeat(t.stars)}</span>}
                <blockquote>“{t.quote}”</blockquote>
                <figcaption>
                  <strong>{t.name}</strong>
                  {t.detail && <> · {t.detail}</>}
                  {t.source && <> · via {t.source}</>}
                </figcaption>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
        {GOOGLE_PROFILE_URL && (
          <p className="sec-more">
            <a className="link-gold" href={GOOGLE_PROFILE_URL} target="_blank" rel="noopener">See all my reviews on Google →</a>
          </p>
        )}
      </div>
    </section>
  );
}
