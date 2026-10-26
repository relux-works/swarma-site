import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fixture, put, run } from './fixture.mjs';
import { generate, sourceHeader, columnHeader, sourcePath, mappingPath, jsonPath } from '../status-data.mjs';

const source = `${sourceHeader}${columnHeader}\n| --- | --- | --- | --- |\n| Слой A | нет | Следующая граница | "Глава A" |\n| Слой B | Контракт | Проверка | "Глава B" |\n`;
const mapping = [{ id: 'layer-a', capability: 'Слой A' }, { id: 'layer-b', capability: 'Слой B' }];
const json = `${JSON.stringify(generate(source, mapping), null, 2)}\n`;
const entries = { [sourcePath]: source, [mappingPath]: JSON.stringify(mapping), [jsonPath]: json };

// The generator preserves each cell's literal content and creates deterministic JSON accepted by the CLI.
test('status-data positive control and verbatim cells', async t => {
  const root = await fixture(t, entries);
  run('status-data', root);
  assert.deepEqual(generate(source, mapping)[0], { id: 'layer-a', capability: 'Слой A', works_today: 'нет', not_yet: 'Следующая граница', chapter: '"Глава A"' });
});
// Stale JSON is rejected without modifying the committed output.
test('status-data stale output', async t => {
  const root = await fixture(t, { ...entries, [jsonPath]: '[]\n' });
  run('status-data', root, 'status-stale');
  assert.equal(await readFile(`${root}/${jsonPath}`, 'utf8'), '[]\n');
});
// Count, order, duplicate identity and invalid slug plants each fail for status-mapping.
for (const [index, bad] of [mapping.slice(1), [...mapping].reverse(), [mapping[0], { ...mapping[1], id: 'layer-a' }], [{ ...mapping[0], id: 'BAD' }, mapping[1]]].entries()) test(`status-data mapping plant ${index}`, async t => {
  const root = await fixture(t, { ...entries, [mappingPath]: JSON.stringify(bad) });
  run('status-data', root, 'status-mapping');
});
// Reordering only the source rows cannot silently reassign stable IDs.
test('status-data reordered source', async t => {
  const lines = source.trimEnd().split('\n');
  const last = lines.pop();
  lines.splice(lines.length - 1, 0, last);
  const root = await fixture(t, { ...entries, [sourcePath]: `${lines.join('\n')}\n` });
  run('status-data', root, 'status-mapping');
});
// Wrong provenance, extra text and malformed tables fail for status-source.
for (const [index, bad] of [source.replace('Version: 1.6.1', 'Version: 9'), source + 'Other book text\n', source.replace('| Контракт |', '| Контракт | Extra |'), source.replace('Слой и возможность', 'Other')].entries()) test(`status-data source plant ${index}`, async t => {
  const root = await fixture(t, { ...entries, [sourcePath]: bad });
  run('status-data', root, 'status-source');
});
// A change to a source cell invalidates old JSON even when mapping identities remain unchanged.
test('status-data changed source cell', async t => {
  const root = await fixture(t, entries);
  await put(root, sourcePath, source.replace('Следующая граница', 'Другая граница'));
  run('status-data', root, 'status-stale');
});

// The old book header is rejected even when every table cell and generated JSON remain identical.
test('status-data rejects previous book version', async t => {
  const root = await fixture(t, { ...entries, [sourcePath]: source.replace('Version: 1.6.1', 'Version: 1.6') });
  run('status-data', root, 'status-source');
});
