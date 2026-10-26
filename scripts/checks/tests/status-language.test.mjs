import test from 'node:test';
import { fixture, run, put } from './fixture.mjs';
import { row, table, statusFiles } from './status-fixture.mjs';

// Neutral bilingual prose passes in both authored and rendered content.
test('status-language positive control', async t => {
  const root = await fixture(t, { 'src/content/pages/ru/index.md': 'Страница готовится.', 'dist/index.html': '<p>Page in preparation.</p>' });
  run('status-language', root);
});
const claims = ['работает сегодня', 'уже работает', 'уже работают', 'уже доступна', 'УЖЕ ДОСТУПНО', 'доступно сейчас', 'запущен', 'запущена', 'запущён', 'в продакшене', 'готово к использованию', 'готова к использованию', 'выпущен', 'выпущена', 'works today', 'available now', 'generally available', 'in production', 'ready to use', 'now live', 'launched', 'SHIPPING NOW'];
// Each listed availability phrase and nearby Russian forms fail in source and rendered prose.
for (const claim of claims) test(`status-language plant ${claim}`, async t => {
  const root = await fixture(t, { 'src/content/pages/ru/index.md': claim });
  run('status-language', root, 'status-language');
  await put(root, 'src/content/pages/ru/index.md', 'Страница готовится.');
  await put(root, 'dist/index.html', `<p>${claim}</p>`);
  run('status-language', root, 'status-language');
});
// Only canonical verified table/row content is exempt; a neighboring paragraph still fails.
test('status-language exemption is bounded to its element', async t => {
  const root = await fixture(t, { ...statusFiles, 'dist/index.html': `${table}<p>Page in preparation.</p>` });
  run('status-language', root);
  await put(root, 'dist/index.html', `${table}<p>available now</p>`);
  run('status-language', root, 'status-language');
  await put(root, 'dist/index.html', '<div data-status-source="unverified">available now</div>');
  run('status-language', root, 'status-provenance');
});

// A standalone canonical row is accepted inside an ordinary table wrapper.
test('status-language valid standalone row', async t => {
  const root = await fixture(t, { ...statusFiles, 'dist/index.html': `<table><tbody>${row}</tbody></table>` });
  run('status-language', root);
});

// Forged regions, changed cells, reordered/missing rows, extra descendants/attributes and unknown IDs fail provenance.
for (const [index, html] of [
  '<p data-status-source="book-1.6.1">Swarma Chain is available now.</p>',
  table.replace('<td>работает сегодня</td>', '<td>available now</td>'),
  table.replace('<td>Следующая граница</td>', '<td><span>Следующая граница</span></td>'),
  table.replace(row, row + row),
  table.replace(row, ''),
  table.replace('scope="row"', 'scope="col"'),
  table.replace('layer-a', 'unknown'),
  table.replaceAll('book-1.6.1', 'book-1.6'),
  table.replace('data-status-source="book-1.6.1"', 'data-status-source="book-1.6.1" aria-label="available now"'),
].entries()) test(`status-language provenance plant ${index}`, async t => {
  const root = await fixture(t, { ...statusFiles, 'dist/index.html': html });
  run('status-language', root, 'status-provenance');
});

// A literal marker anywhere outside the two allowed components fails even if its rendered table is canonical.
test('status-language marker location', async t => {
  const root = await fixture(t, { ...statusFiles, 'src/layouts/Page.astro': table, 'dist/index.html': table });
  run('status-language', root, 'status-marker-location');
});

// A canonical-looking public copy is still outside the two component sources and cannot claim their provenance.
test('status-language public marker location', async t => {
  const root = await fixture(t, { ...statusFiles, 'public/probe.html': table, 'dist/probe.html': table });
  run('status-language', root, 'status-marker-location');
});

// Row reordering is rejected against an independent two-row canonical fixture.
test('status-language reordered canonical rows', async t => {
  const secondRow = row.replaceAll('layer-a', 'layer-b').replaceAll('Слой A', 'Слой B');
  const rows = JSON.parse(statusFiles['src/data/status/layer-map.ru.json']);
  const twoRows = [...rows, { ...rows[0], id: 'layer-b', capability: 'Слой B' }];
  const root = await fixture(t, { 'src/data/status/layer-map.ru.json': JSON.stringify(twoRows), 'dist/index.html': table.replace(row, row + secondRow) });
  run('status-language', root);
  await put(root, 'dist/index.html', table.replace(row, secondRow + row));
  run('status-language', root, 'status-provenance');
});

// Availability in accessible attributes is never exempted by a status marker.
test('status-language marked accessible attribute remains checked', async t => {
  const root = await fixture(t, { ...statusFiles, 'dist/index.html': table.replace('data-status-source="book-1.6.1"', 'data-status-source="book-1.6.1" aria-label="available now"') });
  run('status-language', root, 'status-language');
});

// Encoded accessible labels and meta descriptions cannot hide availability phrases.
for (const attribute of ['alt', 'aria-label', 'aria-description', 'title', 'content']) test(`status-language decoded ${attribute}`, async t => {
  const root = await fixture(t, { 'dist/index.html': `<meta ${attribute}="available&#32;now">` });
  run('status-language', root, 'status-language');
});

// Present/past person, gender and plural forms with today/already fail in source and rendered prose.
for (const form of ['работаю', 'работаешь', 'работает', 'работаем', 'работаете', 'работают', 'работал', 'работала', 'работало', 'работали']) {
  for (const claim of [`${form} сегодня`, `сегодня ${form}`, `уже ${form}`, `${form} уже`]) test(`status-language work form ${claim}`, async t => {
    const root = await fixture(t, { 'src/content/pages/ru/index.md': claim });
    run('status-language', root, 'status-language');
    await put(root, 'src/content/pages/ru/index.md', 'Страница готовится.');
    await put(root, 'dist/index.html', `<p>${claim}</p>`);
    run('status-language', root, 'status-language');
  });
}

// Availability, launch/release and readiness forms cover singular, plural and gender without matching neutral nouns.
for (const claim of ['доступен сейчас', 'доступна сейчас', 'доступны сейчас', 'сейчас доступно', 'уже доступны', 'доступен уже', 'запущено', 'запущены', 'выпущено', 'выпущены', 'готов к использованию', 'готовы к использованию']) test(`status-language neighboring form ${claim}`, async t => {
  const root = await fixture(t, { 'src/content/pages/ru/index.md': claim });
  run('status-language', root, 'status-language');
  await put(root, 'src/content/pages/ru/index.md', 'Страница готовится.');
  await put(root, 'dist/index.html', `<p>${claim}</p>`);
  run('status-language', root, 'status-language');
});

// Neutral domain nouns and their accessible equivalents remain publishable.
test('status-language neutral nouns and attributes', async t => {
  const neutral = 'Запуск агента, готовность, готовность к использованию, доступ к носителю, обработка данных.';
  const root = await fixture(t, { 'src/content/pages/ru/index.md': neutral, 'dist/index.html': `<p>${neutral}</p><img alt="${neutral}" src="/image.png"><meta name="description" content="Страница готовится.">` });
  run('status-language', root);
});
// Authored content cannot grant itself the rendered status exemption.
test('status-language source marker does not exempt prose', async t => {
  const root = await fixture(t, { 'src/content/pages/ru/index.md': '<div data-status-source="book-1.6.1">available now</div>' });
  run('status-language', root, 'status-language');
});
// HTML entities and inline elements cannot hide rendered availability claims; scripts and CSS are not page text.
test('status-language HTML text extraction', async t => {
  const root = await fixture(t, { 'dist/index.html': '<script>const x = "works today";</script><style>/* available now */</style><p>In preparation</p>' });
  run('status-language', root);
  await put(root, 'dist/index.html', '<p>available <strong>n&#111;w</strong></p>');
  run('status-language', root, 'status-language');
});
