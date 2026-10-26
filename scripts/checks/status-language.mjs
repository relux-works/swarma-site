import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { attributes, cli, filesAt, visibleText } from './lib.mjs';
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
  const errors = await markerLocations(root);
  for (const file of await filesAt(root, 'src/content')) {
    const source = await readFile(file, 'utf8');
    if (statusRules(`${source}\n${visibleText(source)}\n${attributes(source, { accessible: true })}`).length) errors.push(`${relative(root, file)}: status-language`);
  }
  for (const file of (await filesAt(root, 'dist')).filter(file => file.endsWith('.html'))) {
    const { parsed, excludedNodes, errors: provenanceErrors } = await verifiedRegions(root, await readFile(file, 'utf8'));
    for (const rule of provenanceErrors) errors.push(`${relative(root, file)}: ${rule}`);
    const prose = `${visibleText(parsed, { excludedNodes })}\n${attributes(parsed, { accessible: true })}`;
    if (statusRules(prose).length) errors.push(`${relative(root, file)}: status-language`);
  }
  return errors;
}
await cli(import.meta.url, check);
