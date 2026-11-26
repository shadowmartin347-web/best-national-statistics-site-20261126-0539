// StatAtlas views: the five pages of the site (overview, countries, one
// country, compare, trends) plus the sources page. Every figure comes from
// SERIES in data.js (World Bank WDI, retrieved 26 November 2026) and is
// formatted by format.js; charts come from charts.js. Nothing here fetches
// anything: the pages are computed entirely in the browser.

import { SERIES, YEARS } from './data.js';
import {
  formatCount, formatBillions, formatDollars, formatPlain, formatPercent,
  formatTick, formatChange,
} from './format.js';
import { lineChart, barChart, legend } from './charts.js';

export const COUNTRIES = [
  { code: 'IDN', name: 'Indonesia', capital: 'Jakarta', region: 'Southeast Asia', color: '#d64541' },
  { code: 'USA', name: 'United States', capital: 'Washington, D.C.', region: 'North America', color: '#2563eb' },
  { code: 'CHN', name: 'China', capital: 'Beijing', region: 'East Asia', color: '#991b1b' },
  { code: 'IND', name: 'India', capital: 'New Delhi', region: 'South Asia', color: '#ea7a1f' },
  { code: 'JPN', name: 'Japan', capital: 'Tokyo', region: 'East Asia', color: '#7c3aed' },
  { code: 'DEU', name: 'Germany', capital: 'Berlin', region: 'Europe', color: '#4b5563' },
  { code: 'BRA', name: 'Brazil', capital: 'Brasília', region: 'South America', color: '#159a5c' },
  { code: 'GBR', name: 'United Kingdom', capital: 'London', region: 'Europe', color: '#0e7c86' },
  { code: 'FRA', name: 'France', capital: 'Paris', region: 'Europe', color: '#4338ca' },
  { code: 'AUS', name: 'Australia', capital: 'Canberra', region: 'Oceania', color: '#c9920e' },
  { code: 'CAN', name: 'Canada', capital: 'Ottawa', region: 'North America', color: '#b3541e' },
  { code: 'NGA', name: 'Nigeria', capital: 'Abuja', region: 'Africa', color: '#1e7d32' },
];

export const INDICATORS = {
  pop: {
    label: 'Population', code: 'SP.POP.TOTL', tick: 'pop',
    fmt: (v) => formatCount(v),
    definition: 'All residents of the country at mid-year, whatever their legal status or citizenship.',
  },
  gdp: {
    label: 'GDP', code: 'NY.GDP.MKTP.CD', tick: 'gdp',
    fmt: (v) => formatBillions(v),
    definition: 'The total value of goods and services produced within the country in a year, in current US dollars. Stored here in billions.',
  },
  gdppc: {
    label: 'GDP per capita', code: 'NY.GDP.PCAP.CD', tick: 'gdppc',
    fmt: (v) => formatDollars(v),
    definition: 'GDP divided by mid-year population: the average economic output per person, in current US dollars.',
  },
  life: {
    label: 'Life expectancy', code: 'SP.DYN.LE00.IN', tick: 'life',
    fmt: (v) => formatPlain(v, 1) + ' years',
    definition: 'How long a newborn would be expected to live if the mortality rates of that year stayed unchanged.',
  },
  urban: {
    label: 'Urban population', code: 'SP.URB.TOTL.IN.ZS', tick: 'pct',
    fmt: (v) => formatPercent(v),
    definition: 'The share of the population living in areas the country itself classifies as urban.',
  },
  net: {
    label: 'Internet users', code: 'IT.NET.USER.ZS', tick: 'pct',
    fmt: (v) => formatPercent(v),
    definition: 'The share of people who used the internet, from any device, in the previous three months.',
  },
  unemp: {
    label: 'Unemployment', code: 'SL.UEM.TOTL.ZS', tick: 'pct',
    fmt: (v) => formatPercent(v),
    definition: 'The share of the labour force without work but available for and seeking work (ILO modelled estimate).',
  },
  co2: {
    label: 'CO₂ per capita', code: 'EN.GHG.CO2.PC.CE.AR5', tick: 'co2',
    fmt: (v) => formatPlain(v, 2) + ' tonnes',
    definition: 'Carbon dioxide emissions from fossil fuels and industry, divided by population, in tonnes per person.',
  },
};

export const INDICATOR_KEYS = Object.keys(INDICATORS);

export function countryByCode(code) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function seriesOf(indKey, code) {
  return SERIES[indKey][code];
}

// The newest published value of an indicator for a country: { value, year }.
export function latestOf(indKey, code) {
  const values = seriesOf(indKey, code);
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] !== null) return { value: values[i], year: YEARS[i] };
  }
  return { value: null, year: null };
}

// The value in a given year, or null when the source publishes none.
export function valueAt(indKey, code, year) {
  const i = YEARS.indexOf(year);
  return i < 0 ? null : seriesOf(indKey, code)[i];
}

// Countries ranked by their latest value of an indicator, best first.
export function rankingOf(indKey) {
  return COUNTRIES
    .map((c) => ({ country: c, ...latestOf(indKey, c.code) }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
}

export function rankOf(indKey, code) {
  return rankingOf(indKey).findIndex((r) => r.country.code === code) + 1;
}

function indicatorOptions(selected) {
  return INDICATOR_KEYS
    .map((k) => `<option value="${k}"${k === selected ? ' selected' : ''}>${INDICATORS[k].label}</option>`)
    .join('');
}

function countryLink(c) {
  return `<a href="#/country/${c.code}">${c.name}</a>`;
}

// ---------------------------------------------------------------- Overview

export function renderOverview(root, params) {
  const indKey = INDICATORS[params.ind] ? params.ind : 'pop';
  const order = params.order === 'asc' ? 'asc' : 'desc';
  const ind = INDICATORS[indKey];
  const ranked = rankingOf(indKey);
  if (order === 'asc') ranked.reverse();
  const maxAbs = Math.max(...ranked.map((r) => Math.abs(r.value ?? 0)), 1);

  const totalPop = COUNTRIES.reduce((sum, c) => sum + (latestOf('pop', c.code).value ?? 0), 0);
  const totalGdp = COUNTRIES.reduce((sum, c) => sum + (latestOf('gdp', c.code).value ?? 0), 0);
  const topLife = rankingOf('life')[0];
  const topNet = rankingOf('net')[0];

  const bars = barChart({
    rows: ranked.map((r) => ({
      label: r.country.name,
      color: r.country.color,
      frac: Math.abs(r.value ?? 0) / maxAbs,
      display: ind.fmt(r.value) + ' (' + r.year + ')',
    })),
  });

  const rows = ranked.map((r) => {
    const first = valueAt(indKey, r.country.code, 1990) ?? valueAt(indKey, r.country.code, 1991);
    const firstYear = valueAt(indKey, r.country.code, 1990) !== null ? 1990 : 1991;
    return `<tr>
      <td>${countryLink(r.country)}</td>
      <td class="num">${ind.fmt(r.value)}</td>
      <td class="num dim">${r.year}</td>
      <td class="num">${ind.fmt(first)}</td>
      <td class="num dim">${firstYear}</td>
      <td class="num">${formatChange(first, r.value)}</td>
    </tr>`;
  }).join('');

  const cards = COUNTRIES.map((c) => `
    <a class="card" href="#/country/${c.code}">
      <span class="card-name"><span class="chip-dot" style="background:${c.color}"></span>${c.name}</span>
      <span class="card-sub">${c.capital} · ${c.region}</span>
      <span class="card-stats">
        <span><label>Population 2024</label>${formatCount(latestOf('pop', c.code).value)}</span>
        <span><label>GDP 2024</label>${formatBillions(latestOf('gdp', c.code).value)}</span>
        <span><label>Life expectancy</label>${INDICATORS.life.fmt(latestOf('life', c.code).value)}</span>
      </span>
    </a>`).join('');

  root.innerHTML = `
    <section class="hero">
      <h1>Twelve countries, eight indicators, thirty-five years</h1>
      <p class="lead">StatAtlas puts the figures a country's statistics office
      leads with — people, economy, health, society, environment — on one page,
      for twelve countries from 1990 to 2024. Every number is a real published
      figure with its year; pick a country to see its full profile, or compare
      countries head to head.</p>
      <div class="stat-strip">
        <div class="stat"><label>People in the 12 countries, 2024</label><strong>${formatCount(totalPop)}</strong></div>
        <div class="stat"><label>Combined GDP, 2024</label><strong>${formatBillions(totalGdp)}</strong></div>
        <div class="stat"><label>Longest lives, 2024</label><strong>${topLife.country.name} · ${INDICATORS.life.fmt(topLife.value)}</strong></div>
        <div class="stat"><label>Most connected, 2024</label><strong>${topNet.country.name} · ${INDICATORS.net.fmt(topNet.value)} online</strong></div>
      </div>
    </section>

    <section>
      <div class="section-head">
        <h2>Ranking: ${ind.label}</h2>
        <div class="controls">
          <label>Indicator
            <select id="ov-ind">${indicatorOptions(indKey)}</select>
          </label>
          <label>Order
            <select id="ov-order">
              <option value="desc"${order === 'desc' ? ' selected' : ''}>Largest first</option>
              <option value="asc"${order === 'asc' ? ' selected' : ''}>Smallest first</option>
            </select>
          </label>
        </div>
      </div>
      <p class="note">${ind.definition} Source: World Bank WDI (${ind.code}).</p>
      ${bars}
      <table class="data">
        <thead><tr><th>Country</th><th class="num">Latest</th><th class="num">Year</th>
        <th class="num">First year</th><th class="num">Year</th><th class="num">Change</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>

    <section>
      <h2>The twelve countries</h2>
      <div class="cards">${cards}</div>
    </section>`;

  root.querySelector('#ov-ind').addEventListener('change', (e) => {
    location.hash = '#/?ind=' + e.target.value + '&order=' + order;
  });
  root.querySelector('#ov-order').addEventListener('change', (e) => {
    location.hash = '#/?ind=' + indKey + '&order=' + e.target.value;
  });
}

// --------------------------------------------------------------- Countries

export function renderCountries(root) {
  const header = INDICATOR_KEYS.map((k) => `<th class="num">${INDICATORS[k].label}</th>`).join('');
  const rows = COUNTRIES.map((c) => {
    const cells = INDICATOR_KEYS.map((k) => {
      const l = latestOf(k, c.code);
      return `<td class="num">${INDICATORS[k].fmt(l.value)}<span class="dim"> ${l.year}</span></td>`;
    }).join('');
    return `<tr><td>${countryLink(c)}</td><td class="dim">${c.capital}</td>${cells}</tr>`;
  }).join('');

  const cards = COUNTRIES.map((c) => `
    <a class="card" href="#/country/${c.code}">
      <span class="card-name"><span class="chip-dot" style="background:${c.color}"></span>${c.name}</span>
      <span class="card-sub">${c.capital} · ${c.region}</span>
      <span class="card-stats">
        <span><label>GDP per capita 2024</label>${formatDollars(latestOf('gdppc', c.code).value)}</span>
        <span><label>Internet users</label>${INDICATORS.net.fmt(latestOf('net', c.code).value)}</span>
        <span><label>Urban share</label>${INDICATORS.urban.fmt(latestOf('urban', c.code).value)}</span>
      </span>
    </a>`).join('');

  root.innerHTML = `
    <section>
      <h1>Countries</h1>
      <p class="lead">Every country in the atlas, with its latest published
      value for all eight indicators. Open a country for its full profile:
      trends since 1990, its rank on each indicator, and how it compares.</p>
      <div class="cards">${cards}</div>
    </section>
    <section>
      <h2>All indicators, latest values</h2>
      <div class="table-scroll">
        <table class="data wide">
          <thead><tr><th>Country</th><th>Capital</th>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="note">Years differ by indicator because each series is published
      on its own schedule; the year beside each value is the year it describes.
      Source: World Bank WDI, retrieved 26 November 2026.</p>
    </section>`;
}

// ----------------------------------------------------------------- Country

export function renderCountry(root, code) {
  const c = countryByCode(code);
  const tiles = INDICATOR_KEYS.map((k) => {
    const l = latestOf(k, c.code);
    const firstYear = valueAt(k, c.code, 1990) !== null ? 1990 : 1991;
    const first = valueAt(k, c.code, firstYear);
    // A series that starts at zero (internet users in 1990) has no percentage
    // change; say where it started instead of showing a dash.
    const change = first === 0
      ? `from ${INDICATORS[k].fmt(first)} in ${firstYear}`
      : `${formatChange(first, l.value)} since ${firstYear}`;
    return `<div class="tile">
      <label>${INDICATORS[k].label}</label>
      <strong>${INDICATORS[k].fmt(l.value)}</strong>
      <span class="dim">${l.year} · rank ${rankOf(k, c.code)} of 12 · ${change}</span>
    </div>`;
  }).join('');

  const trend = (k) => lineChart({
    series: [{ label: c.name, color: c.color, values: seriesOf(k, c.code) }],
    years: YEARS,
    yTick: (v) => formatTick(v, INDICATORS[k].tick),
  });

  const compareRows = INDICATOR_KEYS.map((k) => {
    const ranked = rankingOf(k);
    const leader = ranked[0];
    const mine = latestOf(k, c.code);
    return `<tr>
      <td>${INDICATORS[k].label}</td>
      <td class="num">${INDICATORS[k].fmt(mine.value)} <span class="dim">(${mine.year})</span></td>
      <td class="num">${rankOf(k, c.code)} of 12</td>
      <td>${leader.country.name} · <span class="num">${INDICATORS[k].fmt(leader.value)}</span></td>
    </tr>`;
  }).join('');

  const others = COUNTRIES.filter((o) => o.code !== c.code)
    .map((o) => `<a class="pill" href="#/compare?c=${c.code},${o.code}&ind=pop">${c.name} vs ${o.name}</a>`)
    .join('');

  root.innerHTML = `
    <section>
      <p class="crumb"><a href="#/countries">Countries</a> / ${c.name}</p>
      <h1><span class="chip-dot big" style="background:${c.color}"></span>${c.name}</h1>
      <p class="lead">Capital ${c.capital} · ${c.region}. Population
      ${formatCount(latestOf('pop', c.code).value)} in 2024, GDP
      ${formatBillions(latestOf('gdp', c.code).value)}, life expectancy
      ${INDICATORS.life.fmt(latestOf('life', c.code).value)}. The full record
      since 1990 is below.</p>
      <div class="tiles">${tiles}</div>
    </section>

    <section>
      <h2>Population since 1990</h2>
      ${trend('pop')}
      <h2>GDP since 1990</h2>
      ${trend('gdp')}
      <h2>Life expectancy since 1990</h2>
      ${trend('life')}
    </section>

    <section>
      <h2>How ${c.name} compares</h2>
      <table class="data">
        <thead><tr><th>Indicator</th><th class="num">${c.name}</th><th class="num">Rank</th><th>Leader of the 12</th></tr></thead>
        <tbody>${compareRows}</tbody>
      </table>
      <h3>Head to head</h3>
      <div class="pills">${others}</div>
    </section>`;
}

// ----------------------------------------------------------------- Compare

export function renderCompare(root, params) {
  const chosen = (params.c ? params.c.split(',') : ['IDN', 'USA', 'CHN', 'IND'])
    .filter((code) => COUNTRIES.some((c) => c.code === code));
  const indKey = INDICATORS[params.ind] ? params.ind : 'pop';
  const ind = INDICATORS[indKey];
  const picked = chosen.length ? chosen : ['IDN'];
  const countries = picked.map(countryByCode);

  const chart = lineChart({
    series: countries.map((c) => ({ label: c.name, color: c.color, values: seriesOf(indKey, c.code) })),
    years: YEARS,
    yTick: (v) => formatTick(v, ind.tick),
  });

  const yearCols = [1990, 2000, 2010, 2020, 2024];
  const rows = countries.map((c) => {
    const cells = yearCols.map((y) => `<td class="num">${ind.fmt(valueAt(indKey, c.code, y))}</td>`).join('');
    return `<tr><td><span class="chip-dot" style="background:${c.color}"></span>${countryLink(c)}</td>${cells}</tr>`;
  }).join('');

  const boxes = COUNTRIES.map((c) => `
    <label class="check">
      <input type="checkbox" value="${c.code}"${picked.includes(c.code) ? ' checked' : ''}>
      <span class="chip-dot" style="background:${c.color}"></span>${c.name}
    </label>`).join('');

  const apply = () => {
    const sel = [...root.querySelectorAll('.check input:checked')].map((i) => i.value);
    const indNow = root.querySelector('#cmp-ind').value;
    location.hash = '#/compare?c=' + (sel.join(',') || 'IDN') + '&ind=' + indNow;
  };

  root.innerHTML = `
    <section>
      <h1>Compare countries</h1>
      <p class="lead">Tick the countries and pick an indicator: the chart draws
      every chosen country's full 1990–2024 series on one set of axes.</p>
      <div class="controls-block">
        <div class="checks">${boxes}</div>
        <label>Indicator
          <select id="cmp-ind">${indicatorOptions(indKey)}</select>
        </label>
      </div>
      <h2>${ind.label}</h2>
      <p class="note">${ind.definition} Source: World Bank WDI (${ind.code}).</p>
      ${legend(countries.map((c) => ({ label: c.name, color: c.color })))}
      ${chart}
      <table class="data">
        <thead><tr><th>Country</th>${yearCols.map((y) => `<th class="num">${y}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;

  root.querySelectorAll('.check input').forEach((i) => i.addEventListener('change', apply));
  root.querySelector('#cmp-ind').addEventListener('change', apply);
}

// ------------------------------------------------------------------ Trends

export function renderTrends(root, params) {
  const indKey = INDICATORS[params.ind] ? params.ind : 'gdp';
  const ind = INDICATORS[indKey];

  const chart = lineChart({
    series: COUNTRIES.map((c) => ({ label: c.name, color: c.color, values: seriesOf(indKey, c.code) })),
    years: YEARS,
    yTick: (v) => formatTick(v, ind.tick),
  });

  const growth = COUNTRIES.map((c) => {
    const values = seriesOf(indKey, c.code);
    let first = null, firstYear = null, last = null, lastYear = null;
    values.forEach((v, i) => {
      if (v !== null && first === null) { first = v; firstYear = YEARS[i]; }
      if (v !== null) { last = v; lastYear = YEARS[i]; }
    });
    return { c, first, firstYear, last, lastYear, change: first ? ((last - first) / Math.abs(first)) * 100 : null };
  }).sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity));

  const rows = growth.map((g) => `<tr>
      <td><span class="chip-dot" style="background:${g.c.color}"></span>${countryLink(g.c)}</td>
      <td class="num">${ind.fmt(g.first)} <span class="dim">(${g.firstYear})</span></td>
      <td class="num">${ind.fmt(g.last)} <span class="dim">(${g.lastYear})</span></td>
      <td class="num">${g.change === null ? '—' : (g.change > 0 ? '+' : '') + g.change.toFixed(1) + '%'}</td>
    </tr>`).join('');

  root.innerHTML = `
    <section>
      <div class="section-head">
        <h1>Trends</h1>
        <div class="controls">
          <label>Indicator
            <select id="tr-ind">${indicatorOptions(indKey)}</select>
          </label>
        </div>
      </div>
      <p class="lead">All twelve countries on one chart for
      <strong>${ind.label.toLowerCase()}</strong>, 1990–2024. ${ind.definition}</p>
      ${legend(COUNTRIES.map((c) => ({ label: c.name, color: c.color })))}
      ${chart}
      <h2>Change over the full span</h2>
      <table class="data">
        <thead><tr><th>Country</th><th class="num">First value</th><th class="num">Latest value</th><th class="num">Change</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="note">Change is measured between the first and latest published
      values of the series, whose years are shown beside them. Source: World
      Bank WDI (${ind.code}).</p>
    </section>`;

  root.querySelector('#tr-ind').addEventListener('change', (e) => {
    location.hash = '#/trends?ind=' + e.target.value;
  });
}

// ----------------------------------------------------------------- Sources

export function renderSources(root) {
  const rows = INDICATOR_KEYS.map((k) => {
    const ind = INDICATORS[k];
    const coverage = COUNTRIES.map((c) => {
      const values = seriesOf(k, c.code);
      let first = null, last = null;
      values.forEach((v, i) => {
        if (v !== null && first === null) first = YEARS[i];
        if (v !== null) last = YEARS[i];
      });
      return first + '–' + last;
    });
    const widest = coverage.includes('1990–2024') ? '1990–2024' : coverage[0];
    return `<tr>
      <td>${ind.label}</td>
      <td><code>${ind.code}</code></td>
      <td>${ind.definition}</td>
      <td class="num">${widest}</td>
    </tr>`;
  }).join('');

  root.innerHTML = `
    <section>
      <h1>Sources &amp; method</h1>
      <p class="lead">Every figure on StatAtlas comes from one source: the
      World Bank's World Development Indicators (WDI), the Bank's primary
      collection of development statistics, compiled from national statistics
      offices and international agencies. The data was retrieved on
      26 November 2026 from api.worldbank.org and is shipped inside this
      site's data file, so no page ever fetches anything.</p>

      <h2>The eight indicators</h2>
      <table class="data">
        <thead><tr><th>Indicator</th><th>WDI code</th><th>What it measures</th><th>Span</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <h2>How to read the site</h2>
      <ul class="method">
        <li><strong>Years.</strong> Series run 1990–2024. Where a source
        publishes no value for a year, the site shows a gap in the chart and a
        dash in the table — never an estimate of its own.</li>
        <li><strong>Latest.</strong> "Latest" is the newest published value of
        that series, and its year is always shown beside it; series are
        published on different schedules, so years can differ between
        indicators on the same page.</li>
        <li><strong>Units.</strong> GDP is stored and charted in billions of
        current US dollars and shown in billions or trillions; population in
        people; carbon dioxide in tonnes per person.</li>
        <li><strong>Rounding.</strong> Figures are rounded for display only
        (one decimal for percentages and life expectancy, two for CO₂); the
        stored values keep the precision the source published.</li>
        <li><strong>Coverage.</strong> Twelve countries were chosen to span
        every inhabited continent and the full income range of the WDI, from
        Nigeria's $1,084 GDP per capita to the United States' $86,170 (2024).</li>
      </ul>
      <p class="note">StatAtlas is an original work built for this site; the
      underlying figures belong to their publishers. World Bank data is
      available under the Bank's open data terms.</p>
    </section>`;
}
