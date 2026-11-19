// main.ts — hands the VICE PANELS entry in.
//
// Copies app/ and screenshots/ from this repository into the output
// directory, then writes the entry dossier there with the kit's own
// buildDossier, so the file the scorer reads is built by the same code
// the scorer builds it with. The output directory is $MAKEFUN_OUTPUT_DIR
// when set, else /output when it exists (the grader), else ./output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const out = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : existsSync('/output')
    ? '/output'
    : join(here, 'output');

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`VICE PANELS handed in: ${out}/dossier.json (${dossier.length} bytes)`);
