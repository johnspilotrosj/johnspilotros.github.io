import { Link } from 'react-router-dom';

const SITE = 'https://spilo.xyz';

/* Small Home / Page trail with BreadcrumbList structured data. Every public
   page sits one level below home, so the trail is always two items. */
export default function Breadcrumbs({ current, path, onDark }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: current, item: SITE + path + '/' },
    ],
  };
  return (
    <nav className={'crumbs' + (onDark ? ' crumbs-dark' : '')} aria-label="Breadcrumb">
      <ol>
        <li><Link to="/">Home</Link></li>
        <li><span aria-current="page">{current}</span></li>
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
