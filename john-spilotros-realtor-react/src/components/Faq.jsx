import Reveal from '../bits/Reveal.jsx';

/* FAQ block with FAQPage structured data. Rendered inline so the prerender
   bakes the JSON-LD into the static HTML Google crawls. */
export default function Faq({ heading = 'Straight answers.', items }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  return (
    <section className="section section-alt">
      <div className="wrap">
        <Reveal className="sec-head">
          <h2>{heading}</h2>
        </Reveal>
        <div className="faq">
          {items.map(([q, a], i) => (
            <Reveal key={q} delay={Math.min(i * 0.05, 0.25)}>
              <details className="faq-item">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </section>
  );
}
