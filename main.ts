// LEONIDA LEDGER — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
//
// What this program is: the handover step for a static, offline trophy guide.
// The guide itself is the app/ folder beside this file — plain HTML, CSS and
// ES modules plus two JSON data files, no build step, nothing fetched from a
// network when it runs. This program copies app/ and screenshots/ into the
// output directory and writes dossier.json there with the kit's vendored
// library (vendor/makefun-frontend.ts, left exactly as the kit ships it: the
// scorer rebuilds the dossier with its own copy and compares byte for byte).
//
// Before copying anything it sanity-checks the entry it is about to hand in:
// the app shell exists, the trophy data still names all 55 official trophies,
// every trophy carries a guide in our own words, and the screenshot count is
// inside the gate's cap. A failed check stops the handover with a message
// instead of submitting a broken entry.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output
// outside the grader's container):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const EXPECTED_TROPHIES = 55;
const MAX_SCREENSHOTS = 4;

function fail(message: string): never {
  console.error(`leonida-ledger: cannot hand in — ${message}`);
  process.exit(1);
}

function checkEntry(): { trophies: number; shots: number } {
  const appDir = join(root, 'app');
  if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');
  const dataPath = join(appDir, 'data', 'trophies.json');
  if (!existsSync(dataPath)) fail('app/data/trophies.json is missing');
  const doc = JSON.parse(readFileSync(dataPath, 'utf8'));
  const list = doc?.trophies;
  if (!Array.isArray(list) || list.length !== EXPECTED_TROPHIES) {
    fail(`trophy data names ${Array.isArray(list) ? list.length : 'no'} trophies, expected ${EXPECTED_TROPHIES}`);
  }
  for (const t of list) {
    if (!t?.name || !t?.description || !t?.grade) fail(`trophy #${t?.id ?? '?'} is missing a name, description or grade`);
    if (!t?.guide || !String(t.guide).trim()) fail(`trophy "${t.name}" has no guide text`);
  }
  const shotsDir = join(root, 'screenshots');
  const shots = existsSync(shotsDir)
    ? readdirSync(shotsDir).filter((f) => /\.(jpe?g|png)$/i.test(f))
    : [];
  if (shots.length === 0) fail('screenshots/ holds no images');
  if (shots.length > MAX_SCREENSHOTS) fail(`screenshots/ holds ${shots.length} images, the cap is ${MAX_SCREENSHOTS}`);
  return { trophies: list.length, shots: shots.length };
}

const { trophies, shots } = checkEntry();

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// The scorer's own caps (from the kit's gate): only text_max_bytes shapes the
// dossier's bytes; the rest restate limits the scorer enforces itself, so an
// entry that would be refused is refused here first, in plain language.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`leonida-ledger: handed in ${trophies} trophies, ${shots} screenshots, dossier ${dossier.length} bytes -> ${outDir}`);
