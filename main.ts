// StatAtlas hand-in program (Node 22, standard library only).
//
// The entry itself is the static site under app/: plain files a browser opens
// at app/index.html, with every figure held in its own data file and nothing
// loaded over the network. This program hands the entry in. It copies app/
// and screenshots/ from beside this file into the output directory and writes
// dossier.json there with buildDossier from vendor/makefun-frontend.ts, the
// kit's library, which is shipped unchanged on purpose: the scorer rebuilds
// the dossier with its own copy of the same library and compares the two
// byte for byte.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the site exactly as it stands in the repository.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

// Copy the screenshots the maker took of the site running.
const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), shotsDir, { recursive: true });
}

// Write the dossier with the reference limits the scorer rebuilds against:
// the judge's text cap, at most 4 screenshots of 256 KiB each, and app/
// within 993 entries and 16 MiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
