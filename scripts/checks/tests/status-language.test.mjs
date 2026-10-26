import test from 'node:test';
import { fixture, run, put } from './fixture.mjs';

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
// A provenance-looking marker no longer exempts any availability claim.
test('status-language has no table exemption', async t => {
  const root = await fixture(t, { 'dist/index.html': '<table data-status-source="book-1.6.1"><tbody><tr><td>available now</td></tr></tbody></table>' });
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
