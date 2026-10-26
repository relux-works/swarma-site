import { relative } from 'node:path';
import { cli, filesAt } from './lib.mjs';
import { publicationReader } from './publication-values.mjs';
import { readPublication } from './publication-reader.mjs';
import { markerLocations, verifiedRegions } from './status-provenance.mjs';

const work = 'работ(?:аю|аешь|ает|аем|аете|ают|ал[аои]?)';
const available = 'доступ(?:ен|н(?:а|о|ы|ый|ая|ое|ые|ого|ой|ым|ых|ую|ому|ыми))';
const ready = 'готов(?:а|о|ы|ый|ая|ое|ые|ого|ой|ым|ых|ую|ому|ыми)?';
const russian = [
  `(?:${work}\\s+(?:сегодня|уже)|(?:сегодня|уже)\\s+${work})`,
  `(?:${available}\\s+(?:сейчас|уже)|(?:сейчас|уже)\\s+${available})`,
  'запущ[а-яё]*', 'выпущ[а-яё]*', 'в\\s+продакшене', `${ready}\\s+к\\s+использованию`,
];
const availability = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${russian.join('|')})(?![\\p{L}\\p{N}_])|\\b(?:works\\s+today|available\\s+now|generally\\s+available|in\\s+production|ready\\s+to\\s+use|now\\s+live|launched|shipping\\s+now)\\b`, 'iu');
export function statusRules(text) { return availability.test(text) ? ['status-language'] : []; }
export async function check(root) {
  const reader = await publicationReader(root);
  const errors = await markerLocations(root);
  try {
    for (const file of [...await filesAt(root, 'src/content'), ...(await filesAt(root, 'dist')).filter(file => /\.html?$/u.test(file))]) {
      const path = relative(root, file);
      try {
        const { text: source } = await readPublication(file);
        let excluded = [];
        if (path.startsWith('dist/')) {
          const { parsed, excludedNodes, errors: provenanceErrors } = await verifiedRegions(root, source);
          for (const rule of provenanceErrors) errors.push(`${path}: ${rule}`);
          let index = 0;
          function visit(node) {
            if (node.tagName) { if (excludedNodes.has(node)) excluded.push(index); index += 1; }
            for (const child of node.childNodes ?? []) visit(child);
          }
          visit(parsed);
        }
        const { prose } = await reader.values(path, source, { excluded });
        if (statusRules(prose.join('\n')).length || (!path.startsWith('dist/') && statusRules(source).length)) errors.push(`${path}: status-language`);
      } catch (error) { errors.push(`${path}: ${error.rule ?? 'publication-decode'}`); }
    }
  } finally { await reader.close(); }
  return [...new Set(errors)];
}
await cli(import.meta.url, check);
