import { useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Toaster from './components/Toast.jsx';
import MetaManager from './components/MetaManager.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Listings from './pages/Listings.jsx';
import Buy from './pages/Buy.jsx';
import Sell from './pages/Sell.jsx';
import Relocation from './pages/Relocation.jsx';
import CityPage from './pages/CityPage.jsx';
import { CITIES } from './data/cities.js';

/* Admin is agent-only — keep it out of the main bundle. */
const Admin = lazy(() => import('./pages/Admin.jsx'));

/* New page = start at the top, and move focus onto the page so keyboard and
   screen-reader users land on the fresh content instead of a control that
   just unmounted. Skip the very first load so we don't yank focus on arrival. */
function ScrollManager() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (first.current) { first.current = false; return; }
    document.getElementById('main')?.focus();
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <MetaManager />
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/relocation" element={<Relocation />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {CITIES.map((c) => (
            <Route key={c.slug} path={'/' + c.slug} element={<CityPage city={c} />} />
          ))}
          <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </>
  );
}
