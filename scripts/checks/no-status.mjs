import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { cli, filesAt } from './lib.mjs';
import { publicationReader } from './publication/renderer.mjs';

const statusClasses = new Set(['status-chip', 'status-table', 'status-row', 'status-now', 'status-decided',
  'status-proposed', 'status-specification', 'status-open']);

// Delivery state belongs to the book. Source conventions and browser-resolved status UI are separate prohibitions.
export async function check(root) {
  const errors = [], reader = await publicationReader(root, { assetRoots: ['dist', 'public', 'src'] });
  try {
    for (const scope of ['src/content', 'config', 'public', 'dist']) for (const file of await filesAt(root, scope)) {
      const path = relative(root, file);
      if (!/\.(?:md|html?|json|astro)$/i.test(path)) continue;
      const source = await readFile(file, 'utf8');
      let forbidden = /(?:^|\/)status(?:\/|\.md|\.html)/.test(path)
        || /\[\[status\b|\bstatus_(?:rows|table)\b\s*["']?\s*:|\/(?:ru|en)\/status\//i.test(source);
      if (!forbidden && /\.(?:md|html?)$/i.test(path)) {
        const elements = await reader.elements(path, source);
        forbidden = elements.some(({ classes, attributes }) => classes.some(name => statusClasses.has(name.toLowerCase()))
          || attributes.some(name => name === 'data-status' || name.startsWith('data-status-')));
      }
      if (forbidden) errors.push(`${path}: status-forbidden`);
    }
  } finally { await reader.close(); }
  return errors;
}
await cli(import.meta.url, check);
