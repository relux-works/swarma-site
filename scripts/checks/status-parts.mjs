import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cli } from './lib.mjs';

export const sourcePath = 'src/data/status/source/parts.book-1.6.1.ru.md';
export const mappingPath = 'src/data/status/part-ids.json';
export const jsonPath = 'src/data/status/parts.ru.json';
export const sourceHeader = '# Swarma book\n\n- Version: 1.6.1\n- Chapter: 30, Где мы и что дальше\n- Section: Состояние по частям платформы\n\n';
export function generate(source, mapping) {
  if (!source.startsWith(sourceHeader)) throw new Error('status-parts-source: invalid provenance');
  const rows = []; let section;
  for (const line of source.slice(sourceHeader.length).split('\n')) {
    if (line.startsWith('### ')) section = line.slice(4);
    if (!line.startsWith('|')) continue;
    if (!line.endsWith('|')) throw new Error('status-parts-source: malformed table');
    const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
    if (cells.every(cell => /^-+$/.test(cell))) continue;
    if (!section) {
      if (cells.length !== 2) throw new Error('status-parts-source: vocabulary shape');
      continue;
    }
    if (cells.join('|') === 'Часть|Что это|Статус') continue;
    if (cells.length !== 3 || cells.some(cell => !cell)) throw new Error('status-parts-source: row shape');
    rows.push({ section, part: cells[0], description: cells[1], status: cells[2] });
  }
  if (!rows.length || !Array.isArray(mapping) || rows.length !== mapping.length) throw new Error('status-parts-mapping: count');
  const seen = new Set();
  return rows.map((row, index) => {
    const entry = mapping[index];
    if (!entry || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.id) || seen.has(entry.id) || entry.part !== row.part || entry.section !== row.section) throw new Error('status-parts-mapping: identity or order');
    seen.add(entry.id); return { id: entry.id, ...row };
  });
}
export function vocabulary(source) {
  return source.slice(sourceHeader.length).split('### ')[0].split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| ---') && !line.startsWith('| Статус |')).map((line, index) => {
    const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
    if (cells.length !== 2) throw new Error('status-vocabulary-source');
    return { id: `vocabulary-${index + 1}`, status: cells[0], meaning: cells[1] };
  });
}
export async function check(root, args = []) {
  try {
    const source = await readFile(join(root, sourcePath), 'utf8');
    const mapping = JSON.parse(await readFile(join(root, mappingPath), 'utf8'));
    const words = `${JSON.stringify(vocabulary(source), null, 2)}\n`;
    if (args.includes('--write')) await writeFile(join(root, 'src/data/status/vocabulary.ru.json'), words);
    else if (await readFile(join(root, 'src/data/status/vocabulary.ru.json'), 'utf8') !== words) return ['status-vocabulary-stale'];
    const expected = `${JSON.stringify(generate(source, mapping), null, 2)}\n`;
    if (args.includes('--write')) await writeFile(join(root, jsonPath), expected);
    else if (await readFile(join(root, jsonPath), 'utf8') !== expected) return ['status-parts-stale: JSON differs from source'];
    return [];
  } catch (error) { return [error.message]; }
}
await cli(import.meta.url, check);
