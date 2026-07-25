import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import './bits.css';

/* Old links used hash routes (spilo.xyz/#/about). Rewrite them to real paths
   so bookmarks and shared links keep working after the path-routing move. */
const h = window.location.hash;
if (h.startsWith('#/')) {
  window.history.replaceState(null, '', h.slice(1) + window.location.search);
}

const root = document.getElementById('root');
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

/* Pages are prerendered to static HTML at build time; hydrate when present
   so the first paint isn't thrown away. Dev server root is empty → render. */
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
