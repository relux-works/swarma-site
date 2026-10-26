import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, put, run } from './fixture.mjs';
import { sourceHeader, sourcePath, mappingPath, jsonPath, generate, vocabulary } from '../status-parts.mjs';
const source = sourceHeader + '\n| Статус | Основание |\n| --- | --- |\n| решено | Принято решение. |\n\n### Runtime\n\n| Часть | Что это | Статус |\n| --- | --- | --- |\n| Часть A | Описание `кода` | решено |\n| Часть B | Другая граница | "точная формулировка" |\n';
const mapping = [{ id: 'part-a', section: 'Runtime', part: 'Часть A' }, { id: 'part-b', section: 'Runtime', part: 'Часть B' }];
const expected = [{ id: 'part-a', section: 'Runtime', part: 'Часть A', description: 'Описание `кода`', status: 'решено' }, { id: 'part-b', section: 'Runtime', part: 'Часть B', description: 'Другая граница', status: '"точная формулировка"' }];
const words = [{ id: 'vocabulary-1', status: 'решено', meaning: 'Принято решение.' }];
const entries = { [sourcePath]: source, [mappingPath]: JSON.stringify(mapping), [jsonPath]: JSON.stringify(expected, null, 2) + '\n', 'src/data/status/vocabulary.ru.json': JSON.stringify(words, null, 2) + '\n' };
// Literal expectations preserve inline notation, exact quoted statuses, section names, vocabulary and order.
test('status-parts: independent literal positive control', async t => {
  assert.deepEqual(generate(source, mapping), expected); assert.deepEqual(vocabulary(source), words);
  run('status-parts', await fixture(t, entries));
});
// Row loss, reordering, duplicate IDs, wrong sections and bad slugs cannot silently remap a source row.
for (const [index, bad] of [mapping.slice(1), [...mapping].reverse(), [mapping[0], { ...mapping[1], id: 'part-a' }], [{ ...mapping[0], section: 'Other' }, mapping[1]], [{ ...mapping[0], id: 'BAD' }, mapping[1]]].entries()) test(`status-parts: identity control ${index}`, async t => {
  run('status-parts', await fixture(t, { ...entries, [mappingPath]: JSON.stringify(bad) }), 'status-parts-mapping');
});
// Changed provenance and malformed columns fail source validation rather than being reported as a passing table.
for (const [index, bad] of [source.replace('Chapter: 30', 'Chapter: 29'), source.replace('Version: 1.6.1', 'Version: 1.6'), source.replace('Описание `кода` |', 'Описание `кода` | Extra |'), source.replace('| Часть B | Другая граница | "точная формулировка" |', '| Часть B | Другая граница | "точная формулировка"')].entries()) test(`status-parts: source control ${index}`, async t => {
  run('status-parts', await fixture(t, { ...entries, [sourcePath]: bad }), 'status-parts-source');
});
// Both changed cell content and changed vocabulary invalidate stale generated data without rewriting it.
for (const [name, path, value, rule] of [
  ['cell', sourcePath, source.replace('Другая граница', 'Изменённая граница'), 'status-parts-stale'],
  ['vocabulary', 'src/data/status/vocabulary.ru.json', '[]\n', 'status-vocabulary-stale'],
]) test(`status-parts: stale ${name}`, async t => { const root = await fixture(t, entries); await put(root, path, value); run('status-parts', root, rule); });
