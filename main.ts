// VICE PANELS · Cover Studio — entrypoint.
//
// Running `node main.ts` packages the entry: it copies app/ and
// screenshots/ into the output directory (MAKEFUN_OUTPUT_DIR, default
// ./output beside this file) and writes the dossier the bounty grades —
// buildDossier from the kit's vendor library, run over that copy, so the
// dossier describes exactly the bytes that were packaged.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? join(root, 'output'));

mkdirSync(outDir, { recursive: true });
for (const name of ['app', 'screenshots']) {
  cpSync(join(root, name), join(outDir, name), { recursive: true, force: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

const target = join(outDir, 'dossier.json');
writeFileSync(target, dossier);
console.log(`VICE PANELS dossier written: ${target} (${dossier.length} bytes)`);
