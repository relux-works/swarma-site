import { relative } from 'node:path';
import { cli, scanFiles } from './lib.mjs';
import { publicationReader } from './publication-values.mjs';
import { readPublication } from './publication-reader.mjs';

const forbidden = /\bSwarm\s+(?:Runtime|Protocol|Chain|Keeper|Curator|Signer)\b|\bColony\b|\bSwarm\s+cell\b|(?<![\p{L}\p{N}_])(?:пасек[а-яё]*|улей|ульи|пч[её]л[а-яё]*|соты)(?![\p{L}\p{N}_])|\bApiary\b|\bslopcore\b|\bwaggle\b/iu;
export function nameRules(text) { return forbidden.test(text) ? ['canonical-name'] : []; }
export async function check(root) {
  const reader = await publicationReader(root), errors = [];
  try {
    for (const file of await scanFiles(root)) {
      const path = relative(root, file);
      try {
        const { text, binary } = await readPublication(file);
        if (binary) continue;
        const { prose, values } = await reader.values(path, text);
        if ([text, ...prose, ...values].some(value => nameRules(value).length)) errors.push(`${path}: canonical-name`);
      } catch (error) { errors.push(`${path}: ${error.rule === 'publication-decode' ? error.rule : 'publication-decode'}`); }
    }
  } finally { await reader.close(); }
  return [...new Set(errors)];
}
await cli(import.meta.url, check);
