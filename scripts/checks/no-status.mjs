import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { cli, filesAt } from './lib.mjs';

// Delivery state belongs to the book; authored keys/markers and rendered status UI are forbidden.
export async function check(root) {
  const errors = [];
  for (const scope of ['src/content', 'config', 'public', 'dist']) for (const file of await filesAt(root, scope)) {
    const path = relative(root, file);
    if (!/\.(?:md|html|json|astro)$/i.test(path)) continue;
    const source = await readFile(file, 'utf8');
    if (/(?:^|\/)status(?:\/|\.md|\.html)/.test(path)
      || /\[\[status\b|\bstatus_(?:rows|table)\b\s*["']?\s*:|data-status-(?:source|row)|class=["'][^"']*\bstatus-(?:chip|now|decided|proposed|specification|open)\b|\/(?:ru|en)\/status\//i.test(source)) errors.push(`${path}: status-forbidden`);
  }
  return errors;
}
await cli(import.meta.url, check);
