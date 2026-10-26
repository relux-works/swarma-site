import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { cli } from './lib.mjs';
import { approvedFont } from './font-approved.mjs';
export async function check(root) {
  try {
    const manifest = JSON.parse(await readFile(join(root, 'src/data/font-assets.json'), 'utf8'));
    const errors = [];
    for (const [path, entry] of Object.entries(manifest)) {
      const shipped = await readFile(join(root, path));
      const original = await readFile(join(root, 'node_modules', entry.package, entry.file));
      const metadata = JSON.parse(await readFile(join(root, 'node_modules', entry.package, 'package.json'), 'utf8'));
      if (!await approvedFont(root, path, shipped) || !shipped.equals(original) || metadata.version !== entry.version) errors.push(`${path}: font-integrity`);
      const license = await readFile(join(root, 'node_modules', entry.package, 'LICENSE'));
      const bundled = await readFile(join(root, 'public/fonts', path.split('/')[2], 'OFL.txt'));
      if (!license.equals(bundled)) errors.push(`${path}: font-license`);
      if (await stat(join(root, 'dist')).catch(() => null)) {
        const output = await readFile(join(root, path.replace(/^public\//, 'dist/')));
        if (!output.equals(shipped)) errors.push(`${path}: font-output-integrity`);
      }
    }
    return errors;
  } catch (error) { return [`font-assets: ${error.message}`]; }
}
await cli(import.meta.url, check);
