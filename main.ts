import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const projectRoot = fileURLToPath(new URL('./', import.meta.url));
const deliveryRoot = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(deliveryRoot, { recursive: true });
for (const directory of ['app', 'screenshots']) {
  cpSync(join(projectRoot, directory), join(deliveryRoot, directory), { recursive: true });
}

const studioDossier = buildDossier(deliveryRoot, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(deliveryRoot, 'dossier.json'), studioDossier);
