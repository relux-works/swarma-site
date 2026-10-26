import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { cli, filesAt } from './lib.mjs';

// The copied manifest entries retain the paths and hashes of the pinned owner's asset manifest.
export async function approvedBrand(root, path, data) {
  let manifest;
  try { manifest = JSON.parse(await readFile(join(root, 'src/data/brand-assets.json'), 'utf8')); }
  catch { return false; }
  const entry = manifest.assets.find(entry => `public/brand/${entry.path.split('/').at(-1)}` === path);
  return !!entry && data.length === entry.bytes && createHash('sha256').update(data).digest('hex') === entry.sha256;
}
export async function check(root) {
  const manifest = JSON.parse(await readFile(join(root, 'src/data/brand-assets.json'), 'utf8'));
  const errors = [];
  for (const entry of manifest.assets) {
    const path = `public/brand/${entry.path.split('/').at(-1)}`;
    try { if (!await approvedBrand(root, path, await readFile(join(root, path)))) errors.push(`${path}: brand-integrity`); }
    catch { errors.push(`${path}: brand-integrity`); }
  }
  for (const file of await filesAt(root, 'dist/brand')) {
    const name = file.split('/').at(-1), entry = manifest.assets.find(entry => entry.path.endsWith(`/${name}`));
    if (entry && createHash('sha256').update(await readFile(file)).digest('hex') !== entry.sha256) errors.push(`dist/brand/${name}: brand-integrity`);
  }
  return errors;
}
await cli(import.meta.url, check);
