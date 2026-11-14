// After `vite build`: writes dist/pulsaris.html, one self-contained file (JS and CSS inlined).
// It opens from disk with no server, which suits an offline tablet and a hackathon demo.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
let html = readFileSync(join(dist, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, f) => `<style>${readFileSync(join(dist, f), 'utf8')}</style>`);
html = html.replace(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_, f) =>
  `<script type="module">${readFileSync(join(dist, f), 'utf8').replace(/<\/script/g, '<\/script')}</script>`);
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');
writeFileSync(join(dist, 'pulsaris.html'), html);
console.log('Wrote dist/pulsaris.html', Math.round(html.length / 1024) + ' kB');
