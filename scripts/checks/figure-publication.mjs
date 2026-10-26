import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { relative, basename } from 'node:path';
import { cli, filesAt, document } from './lib.mjs';
const hash = data => createHash('sha256').update(data).digest('hex');
const compact = text => text.replace(/\s+/g, '');
function geometry(text) {
  const values = [];
  function visit(node) {
    for (const attr of node.attrs ?? []) if (['d', 'points'].includes(attr.name) && attr.value.length > 24) values.push(compact(attr.value));
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(document(text)); return values;
}
export async function check(root, args = []) {
  if (!args.includes('--off') && process.env.SWARMA_BOOK_FIGURES === '1') return [];
  const originals = await Promise.all((await filesAt(root, 'src/assets/book-figures')).map(async path => {
    const data = await readFile(path), text = data.toString('utf8');
    return { name: basename(path, '.svg'), hash: hash(data), compact: compact(text), base64: data.toString('base64'), geometry: geometry(text) };
  }));
  const errors = [];
  for (const file of await filesAt(root, 'dist')) {
    const data = await readFile(file), text = data.toString('utf8');
    let decoded = text;
    try { decoded += decodeURIComponent(text); } catch { /* Raw and base64 representations remain checked. */ }
    const condensed = compact(decoded);
    if (originals.some(original => original.hash === hash(data) || text.includes(original.hash)
      || text.includes(original.base64) || condensed.includes(original.compact)
      || (original.geometry.length && original.geometry.every(value => condensed.includes(value)))
      || new RegExp(`(?:^|[/_.-])${original.name}(?:[_.-]|$)`).test(basename(file)))) errors.push(`${relative(root, file)}: figure-publication`);
  }
  return errors;
}
await cli(import.meta.url, check);
