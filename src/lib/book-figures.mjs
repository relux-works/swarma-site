import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { loadData } from './content-data.mjs';

export function bookFigureAsset(file) {
  const bytes = readFileSync(new URL(`../assets/book-figures/${file}`, import.meta.url));
  const hash = createHash('sha256').update(bytes).digest('hex');
  return { bytes, src: `/_astro/book-figures/${hash}.svg` };
}

// Only referenced figures in an explicitly enabled static build become output assets.
export async function emitBookFigures(directory, enabled) {
  if (!enabled) return;
  const root = fileURLToPath(directory), sources = new Set();
  function images(node) {
    if (node.tagName === 'img') sources.add(node.attrs?.find(attr => attr.name === 'src')?.value);
    for (const child of node.childNodes ?? []) images(child);
  }
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.endsWith('.html')) images(parse(await readFile(path, 'utf8')));
    }
  }
  await visit(root);
  for (const figure of Object.values(loadData('figures'))) {
    const asset = bookFigureAsset(figure.file);
    if (!sources.has(asset.src)) continue;
    const target = join(root, asset.src);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, asset.bytes);
  }
}
