// StatAtlas router: a hash-routed single page. Each route renders one view
// from views.js into <main>; the hash carries the view's state (the chosen
// indicator, the compared countries), so every page has a link of its own
// and the back button works. No route fetches anything.

import {
  renderOverview, renderCountries, renderCountry, renderCompare,
  renderTrends, renderSources, countryByCode,
} from './views.js';

const root = document.getElementById('app');

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  return { path, params };
}

function setActiveNav(section) {
  document.querySelectorAll('.site-nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === section);
  });
}

function route() {
  const { path, params } = parseHash();
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) {
    setActiveNav('overview');
    renderOverview(root, params);
    document.title = 'StatAtlas — National Statistics for 12 Countries';
  } else if (parts[0] === 'countries') {
    setActiveNav('countries');
    renderCountries(root);
    document.title = 'Countries — StatAtlas';
  } else if (parts[0] === 'country' && parts[1]) {
    setActiveNav('countries');
    const c = countryByCode(parts[1].toUpperCase());
    renderCountry(root, c.code);
    document.title = c.name + ' — StatAtlas';
  } else if (parts[0] === 'compare') {
    setActiveNav('compare');
    renderCompare(root, params);
    document.title = 'Compare countries — StatAtlas';
  } else if (parts[0] === 'trends') {
    setActiveNav('trends');
    renderTrends(root, params);
    document.title = 'Trends — StatAtlas';
  } else if (parts[0] === 'sources') {
    setActiveNav('sources');
    renderSources(root);
    document.title = 'Sources & method — StatAtlas';
  } else {
    setActiveNav('overview');
    renderOverview(root, params);
    document.title = 'StatAtlas — National Statistics for 12 Countries';
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
