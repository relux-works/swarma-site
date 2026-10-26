import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
export const digest = data => createHash('sha256').update(data).digest('hex');
export async function approvedFont(root, path, data) {
  if (!/^(?:public|dist)\/fonts\/.+\.woff2$/.test(path)) return false;
  try {
    const manifest = JSON.parse(await readFile(join(root, 'src/data/font-assets.json'), 'utf8'));
    const entry = manifest[path.replace(/^dist\//, 'public/')];
    return data.subarray(0, 4).toString() === 'wOF2' && data.length >= 48 && data.readUInt32BE(8) === data.length && entry?.sha256 === digest(data);
  } catch { return false; }
}
