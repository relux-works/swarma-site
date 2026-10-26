import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cli } from './lib.mjs';

export const sourcePath = 'src/data/status/source/layer-map.book-1.6.1.ru.md';
export const mappingPath = 'src/data/status/row-ids.json';
export const jsonPath = 'src/data/status/layer-map.ru.json';
export const sourceHeader = '# Swarma book\n\n- Version: 1.6.1\n- Chapter: 29, Где мы и что дальше\n- Section: Карта по слоям\n\n';
export const columnHeader = '| Слой и возможность | Работает сегодня | Чего ещё нет | Глава |';

export function generate(source, mapping) {
  if (!source.startsWith(sourceHeader)) throw new Error('status-source: invalid provenance header');
  const lines = source.slice(sourceHeader.length).trimEnd().split('\n');
  if (lines[0] !== columnHeader || lines[1] !== '| --- | --- | --- | --- |') throw new Error('status-source: invalid columns');
  const rows = lines.slice(2).map(line => {
    if (!line.startsWith('|') || !line.endsWith('|')) throw new Error('status-source: unexpected text');
    const cells = line.slice(1, -1).split('|').map(value => value.trim());
    if (cells.length !== 4 || cells.some(value => !value)) throw new Error('status-source: invalid row');
    return cells;
  });
  if (!rows.length || !Array.isArray(mapping) || mapping.length !== rows.length) throw new Error('status-mapping: row count differs');
  const seen = new Set();
  return rows.map(([capability, works_today, not_yet, chapter], index) => {
    const entry = mapping[index];
    if (!entry || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.id) || seen.has(entry.id) || entry.capability !== capability) {
      throw new Error('status-mapping: invalid identity or row order');
    }
    seen.add(entry.id);
    return { id: entry.id, capability, works_today, not_yet, chapter };
  });
}

export async function check(root, args = []) {
  try {
    const source = await readFile(join(root, sourcePath), 'utf8');
    const mapping = JSON.parse(await readFile(join(root, mappingPath), 'utf8'));
    const expected = `${JSON.stringify(generate(source, mapping), null, 2)}\n`;
    if (args.includes('--write')) await writeFile(join(root, jsonPath), expected);
    else if (await readFile(join(root, jsonPath), 'utf8') !== expected) return ['status-stale: JSON differs from source'];
    return [];
  } catch (error) { return [/^status-(?:source|mapping):/u.test(error.message) ? error.message : 'status-data: cannot read canonical data']; }
}
await cli(import.meta.url, check);
