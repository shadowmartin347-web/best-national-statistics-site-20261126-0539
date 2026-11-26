// StatAtlas screenshot capture: drives the Playwright Chromium build over
// the DevTools protocol (Node's built-in WebSocket, no dependencies) and
// photographs four views of the site served by serve.ts. The site is fully
// deterministic (no clocks, no randomness, no network), so two runs of this
// script produce byte-identical images; the build verifies that.
//
//   node capture.mjs <output-dir>     (serve.ts must be running on :8123)

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = 'http://localhost:8123';
const OUT = process.argv[2] ?? 'screenshots';
const CHROME = join(homedir(), '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const DEBUG_PORT = 9223;

const SHOTS = [
  { file: '1-overview.jpg', url: BASE + '/#/', width: 1280, height: 800 },
  { file: '2-country-indonesia.jpg', url: BASE + '/#/country/IDN', width: 1280, height: 800 },
  { file: '3-compare-gdp.jpg', url: BASE + '/#/compare?c=IDN,USA,CHN,IND&ind=gdp', width: 1280, height: 800 },
  { file: '4-overview-phone.jpg', url: BASE + '/#/', width: 390, height: 844 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDebugger() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://localhost:${DEBUG_PORT}/json/version`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chromium debugger did not start');
}

// A minimal CDP client: request/response by id over one WebSocket.
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      listeners.get(msg.method)(msg.params);
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return {
    ready,
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    once(method) {
      return new Promise((resolve) => listeners.set(method, resolve));
    },
    close() { ws.close(); },
  };
}

async function shoot(shot) {
  const targetRes = await fetch(`http://localhost:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
  const target = await targetRes.json();
  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.ready;

  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: shot.width, height: shot.height, deviceScaleFactor: 1, mobile: shot.width < 600,
  });
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: shot.url });
  await loaded;
  // Let the module scripts run and the view render; the render is synchronous
  // once data.js is parsed, so a short settle is enough and stays identical
  // between runs.
  await sleep(600);

  const state = await cdp.send('Runtime.evaluate', {
    expression: '({ title: document.title, sections: document.querySelectorAll("#app section").length, svgs: document.querySelectorAll("#app svg").length })',
    returnByValue: true,
  });
  const view = state.result.value;
  if (!view || view.sections < 1 || view.svgs < 1) {
    throw new Error('page did not render for ' + shot.url + ': ' + JSON.stringify(view));
  }
  const shotRes = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, shot.file), Buffer.from(shotRes.data, 'base64'));
  console.log(shot.file, JSON.stringify(view));
  await cdp.send('Page.close').catch(() => {});
  cdp.close();
}

const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--force-color-profile=srgb', '--disable-dev-shm-usage',
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--user-data-dir=/tmp/ns-chrome-profile',
  'about:blank',
], { stdio: 'ignore' });

try {
  await waitForDebugger();
  for (const shot of SHOTS) await shoot(shot);
  console.log('captured', SHOTS.length, 'shots into', OUT);
} finally {
  chrome.kill('SIGKILL');
}
