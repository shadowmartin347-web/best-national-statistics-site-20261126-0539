// StatAtlas local preview server (Node 22, standard library only).
//
// Serves app/ over HTTP so the site can be opened in a desktop browser and at
// a phone size, exactly as any static host would serve it: app/ is the root,
// "/" is app/index.html, and a root-relative path such as /style.css names
// app/style.css. Nothing is built or transformed; the bytes on disk are the
// bytes served.
//
//   node serve.ts            serves on http://localhost:8080
//   node serve.ts --port 9   serves on another port

import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const appDir = join(repoDir, 'app');

const portFlag = process.argv.indexOf('--port');
const port = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = normalize(join(appDir, relative));

  // Refuse anything that climbs out of app/.
  if (!filePath.startsWith(appDir)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    if (!statSync(filePath).isFile()) throw new Error('not a file');
    const body = readFileSync(filePath);
    response.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found: ' + pathname);
  }
});

server.listen(port, () => {
  console.log('StatAtlas preview at http://localhost:' + port + '/');
});
