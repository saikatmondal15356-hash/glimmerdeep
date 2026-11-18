// Glimmerdeep — the program that hands the game in (Node 22, stdlib only).
//
// The game itself is plain static files under game/ (index.html plus ES
// modules, no library, no network request), and the screenshots are real
// renders of it in screenshots/. This program copies both into the output
// directory and writes /output/dossier.json with the vendored make.fun
// library, which is the summary the judge reads.
//
// The grader runs it twice in a fresh container with no network, a
// read-only copy of this repository and a writable /output; outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps: at most 4 screenshots of 256 KiB, game/ under 993
// entries and 48 MiB with no path over 1000 bytes, and the dossier text
// capped at 160 KiB — the same limits the gate enforces on /output.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
