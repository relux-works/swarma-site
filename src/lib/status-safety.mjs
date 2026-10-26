import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { publicConfig } from '../../scripts/checks/site-config.mjs';
import { identifierRules } from '../../scripts/checks/identifier-rules.mjs';
import { visibleText, attributes } from '../../scripts/checks/lib.mjs';
import { nameRules } from '../../scripts/checks/names.mjs';

export function validateStatusSources(root) {
  const { allowlist } = publicConfig(fileURLToPath(new URL('../../', root)));
  for (const path of ['source/layer-map.book-1.6.1.ru.md', 'source/parts.book-1.6.1.ru.md', 'layer-map.ru.json', 'parts.ru.json', 'vocabulary.ru.json']) {
    const data = readFileSync(new URL(`../data/status/${path}`, root), 'utf8');
    const text = `${data}\n${visibleText(data)}\n${attributes(data)}`;
    const errors = [...identifierRules(text, allowlist), ...nameRules(text)];
    if (errors.length) throw new Error(`status-source-policy: ${path}: ${errors.join(', ')}`);
  }
}
