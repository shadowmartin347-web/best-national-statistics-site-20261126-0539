// StatAtlas charts: small hand-built SVG charts. Both builders are pure
// functions from data to an SVG string, so every page shows the same chart
// the same way, and a series with missing years simply breaks its line
// instead of inventing a value.

// A multi-series line chart over the shared year axis.
// series: [{ label, color, values }] with values aligned to years.
// yTick: (value) => short axis label.
export function lineChart({ series, years, width = 720, height = 300, yTick }) {
  const padL = 52, padR = 14, padT = 12, padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  let min = Infinity, max = -Infinity;
  for (const s of series) {
    for (const v of s.values) {
      if (v === null || v === undefined) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!isFinite(min)) { min = 0; max = 1; }
  if (min === max) { min -= 1; max += 1; }
  // Give the scale a little headroom and a floor at zero for counts/money.
  const span = max - min;
  max += span * 0.08;
  if (min > 0 && min - span * 0.25 < 0) min = 0;

  const x = (i) => padL + (i / (years.length - 1)) * plotW;
  const y = (v) => padT + plotH - ((v - min) / (max - min)) * plotH;

  const parts = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" class="chart" role="img">`);

  // Horizontal gridlines with y tick labels.
  for (let g = 0; g <= 4; g++) {
    const value = min + (g / 4) * (max - min);
    const gy = y(value);
    parts.push(`<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}" class="grid"/>`);
    parts.push(`<text x="${padL - 7}" y="${gy + 4}" class="tick" text-anchor="end">${yTick(value)}</text>`);
  }

  // X axis: first year, two round decades, last year.
  const xLabels = [0];
  years.forEach((yr, i) => { if (yr % 10 === 0 && i !== 0) xLabels.push(i); });
  if (xLabels[xLabels.length - 1] !== years.length - 1) xLabels.push(years.length - 1);
  for (const i of xLabels) {
    parts.push(`<text x="${x(i)}" y="${height - 6}" class="tick" text-anchor="middle">${years[i]}</text>`);
  }

  // One path per series; nulls break the path into segments.
  for (const s of series) {
    let d = '';
    let pen = false;
    s.values.forEach((v, i) => {
      if (v === null || v === undefined) { pen = false; return; }
      d += (pen ? ' L' : ' M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1);
      pen = true;
    });
    if (d) parts.push(`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round"/>`);
    // End dot on the last present value.
    for (let i = s.values.length - 1; i >= 0; i--) {
      const v = s.values[i];
      if (v !== null && v !== undefined) {
        parts.push(`<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="${s.color}"/>`);
        break;
      }
    }
  }

  parts.push('</svg>');
  return parts.join('');
}

// A horizontal bar ranking. rows: [{ label, display, frac }] where frac is
// the bar length as a share of the widest bar (0..1), precomputed by the
// caller so bars of unlike units never mix.
export function barChart({ rows, width = 720, rowH = 27 }) {
  const labelW = 118, valueW = 108;
  const height = rows.length * rowH + 6;
  const barMax = width - labelW - valueW;
  const parts = [];
  parts.push(`<svg viewBox="0 0 ${width} ${height}" class="chart" role="img">`);
  rows.forEach((row, i) => {
    const cy = i * rowH + 3;
    parts.push(`<text x="${labelW - 8}" y="${cy + rowH / 2 + 4}" class="bar-label" text-anchor="end">${row.label}</text>`);
    parts.push(`<rect x="${labelW}" y="${cy + 3}" width="${Math.max(2, row.frac * barMax)}" height="${rowH - 8}" rx="3" fill="${row.color}"/>`);
    parts.push(`<text x="${labelW + Math.max(2, row.frac * barMax) + 8}" y="${cy + rowH / 2 + 4}" class="bar-value">${row.display}</text>`);
  });
  parts.push('</svg>');
  return parts.join('');
}

// A legend row of colour chips, shared by every chart page.
export function legend(items) {
  const chips = items
    .map((it) => `<span class="chip"><span class="chip-dot" style="background:${it.color}"></span>${it.label}</span>`)
    .join('');
  return `<div class="legend">${chips}</div>`;
}
