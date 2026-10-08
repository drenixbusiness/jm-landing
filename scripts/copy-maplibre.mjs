// Copies MapLibre's worker (and the chunk it imports) into /public so the browser can load it by URL.
// MapLibre v6 resolves its worker with a dynamic `new URL(...)` that bundlers can't follow.
import fs from 'node:fs';
import path from 'node:path';

const src = path.join('node_modules', 'maplibre-gl', 'dist');
const out = path.join('public', 'maplibre');
fs.mkdirSync(out, { recursive: true });
for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  if (fs.existsSync(path.join(src, f))) fs.copyFileSync(path.join(src, f), path.join(out, f));
}
