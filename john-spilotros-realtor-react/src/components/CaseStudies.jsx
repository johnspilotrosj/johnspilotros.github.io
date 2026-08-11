import Reveal from '../bits/Reveal.jsx';
import SpotlightCard from '../bits/SpotlightCard.jsx';
import { CASE_STUDIES } from '../data/site.js';

/* Real client stories, populated in site.js as deals close. Renders nothing
   while the list is empty, same pattern as the social icons. */
export default function CaseStudies() {
  if (!CASE_STUDIES.length) return null;
  return (
    <section className="section" id="case-studies">
      <div className="wrap">
        <Reveal className="sec-head">
          <h2>Recent moves, real results.</h2>
          <p>How actual deals played out, told straight: the situation, what we did, and where it landed.</p>
        </Reveal>
        <div className="case-grid">
          {CASE_STUDIES.map((c, i) => (
            <Reveal key={c.title} delay={Math.min(i * 0.06, 0.3)}>
              <SpotlightCard className="case-card">
                <p className="case-tag">{c.tag} · {c.location}</p>
                <h3>{c.title}</h3>
                <p>{c.story}</p>
                <p className="case-result">{c.result}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
