// VICE PANELS · Cover Studio — entry program for the make.fun
// gta6-cover-art-01 bounty. Run with `node main.ts`: it copies the app and
// its screenshots into the output directory and writes the entry dossier
// there with the kit's own builder, so the handed-in dossier is byte for
// byte the one the scorer rebuilds from the same files.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR?.trim() || join(repoRoot, 'output');

try {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });

  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`VICE PANELS handed in: ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
} catch (err) {
  console.error(`VICE PANELS hand-in failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
