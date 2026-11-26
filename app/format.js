// StatAtlas number formatting: every figure the site shows passes through
// here, so a population, a dollar amount and a percentage always read the
// same way wherever they appear.

// 283487931 -> "283.5 million"; 1408975000 -> "1.41 billion".
export function formatCount(value) {
  if (value === null || value === undefined) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e9) return trim(value / 1e9) + ' billion';
  if (abs >= 1e6) return trim(value / 1e6) + ' million';
  if (abs >= 1e3) return trim(value / 1e3) + ' thousand';
  return String(Math.round(value));
}

// 29298.0 (billions) -> "$29.30 trillion"; 252.3 -> "$252.3 billion".
export function formatBillions(value) {
  if (value === null || value === undefined) return '—';
  if (Math.abs(value) >= 1000) return '$' + trim(value / 1000) + ' trillion';
  return '$' + trim(value) + ' billion';
}

// 86170 -> "$86,170".
export function formatDollars(value) {
  if (value === null || value === undefined) return '—';
  return '$' + groupThousands(Math.round(value));
}

// 71.3 -> "71.3"; used for years of life, tonnes, and other plain measures.
export function formatPlain(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return value.toFixed(decimals);
}

// 58.8 -> "58.8%".
export function formatPercent(value) {
  if (value === null || value === undefined) return '—';
  return trim(value) + '%';
}

// Axis tick for a chart: short, never more than ~6 characters.
export function formatTick(value, kind) {
  if (kind === 'pop') {
    if (value >= 1e9) return trim(value / 1e9) + 'B';
    if (value >= 1e6) return trim(value / 1e6) + 'M';
    return String(Math.round(value));
  }
  if (kind === 'gdp') {
    if (value >= 1000) return '$' + trim(value / 1000) + 'T';
    return '$' + Math.round(value) + 'B';
  }
  if (kind === 'gdppc') return '$' + Math.round(value / 1000) + 'k';
  if (kind === 'co2') return trim(value) + ' t';
  if (kind === 'life') return trim(value) + ' yrs';
  return trim(value) + '%';
}

// Signed change between two years: "+12.4%" or "-3.1%".
export function formatChange(first, last) {
  if (first === null || last === null || first === 0) return '—';
  const pct = ((last - first) / Math.abs(first)) * 100;
  const sign = pct > 0 ? '+' : '';
  return sign + pct.toFixed(1) + '%';
}

function trim(value) {
  // Up to 2 decimals, trailing zeros dropped: 1.40 -> "1.4", 29.30 -> "29.3".
  return String(Math.round(value * 100) / 100);
}

function groupThousands(int) {
  return String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
