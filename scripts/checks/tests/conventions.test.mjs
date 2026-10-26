import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fixture, put, page, run } from './fixture.mjs';
import { document, visibleText } from '../lib.mjs';
import { approvedFont } from '../font-approved.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
const evidence = [];
after(async () => { await mkdir(join(repository, '.temp'), { recursive: true }); await writeFile(join(repository, '.temp/conventions-evidence.json'), JSON.stringify(evidence, null, 2) + '\n'); });
async function sourceFixture(t, content) {
  const root = await fixture(t);
  for (const path of ['src', 'public', 'config', 'scripts', 'astro.config.mjs', 'package.json', 'tsconfig.json']) await cp(join(repository, path), join(root, path), { recursive: true });
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  await put(root, 'src/content/pages/ru/platform.md', content);
  return root;
}
function build(root, figures = false, diagnostic) {
  const result = spawnSync(process.execPath, [join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root], { cwd: root, encoding: 'utf8', timeout: 60000, env: { ...process.env, SWARMA_BOOK_FIGURES: figures ? '1' : '0' } });
  assert.ifError(result.error);
  const output = result.stdout + result.stderr;
  assert.equal(result.status, diagnostic ? 1 : 0, output);
  if (diagnostic) {
    assert.ok(output.includes(diagnostic), output);
    assert.match(output, /platform\.md:\d+:/);
    const source = readFileSync(join(root, 'src/content/pages/ru/platform.md'), 'utf8');
    const referenceLine = source.split('\n').findIndex(line => line.startsWith('Источник: '));
    if (referenceLine >= 0) assert.ok(output.includes(`platform.md:${referenceLine + 1}:`), output);
  }
  evidence.push({ figures, buildExit: result.status, diagnostic: diagnostic ?? 'valid conventions' });
}
const metadata = '';
const richBody = `Проектное описание по книге.\n\n## Три слоя\n\nSwarma Runtime, Swarma Protocol, Swarma Chain.\n\nИсточник: глава 02 "Swarma целиком", раздел "Имена и участники"; глава 08 "Допуск к носителю"\n\n### Граница\n\n> **Предел.** Описание границы.\n\n### Ещё одна граница\n\n> **Предел.** Другая граница.\n\n> Обычная цитата.\n\n| Часть | Вопрос |\n| --- | --- |\n| Runtime | Граница |\n\n[[figure three-layers]]\n\n[[figure protocol-topology]]\n\n[[figure sublayers]]\n\n[[publications book]]\n\n[[publications papers]]\n\n[[repos]]\n`;
function content(extra = metadata, body = richBody) { return page(extra ? extra + '\n' : '', body); }
function nodes(node) { return [node, ...(node.childNodes ?? []).flatMap(nodes)]; }
const attr = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
// Real builds exercise references, limits, tables, publications, repositories and both figure modes.
for (const figures of [false, true]) test(`conventions: complete valid fixture, figures ${figures}`, async t => {
  const root = await sourceFixture(t, content());
  // Real counterparts expose both language landmarks, catching duplicate header/footer names.
  await put(root, 'src/content/pages/en/platform.md', page('', 'Page in preparation.'));
  await put(root, 'src/content/pages/en/principles.md', page('', 'Principles.').replace('title: Swarma', 'title: Cross-cutting principles'));
  await put(root, 'src/content/pages/ru/open-source.md', page('', '[[repos]]').replace('title: Swarma', 'title: Открытый код'));
  await put(root, 'src/content/pages/en/open-source.md', page('', '[[repos]]').replace('title: Swarma', 'title: Open source'));
  build(root, figures);
  const html = await readFile(join(root, 'dist/ru/platform/index.html'), 'utf8');
  const all = nodes(document(html));
  assert.equal(all.filter(node => node.tagName === 'h1').length, 1);
  assert.equal(all.filter(node => attr(node, 'class') === 'design-frame').length, 0);
  assert.equal(all.filter(node => attr(node, 'class') === 'section-index').length, 1);
  assert.equal(all.filter(node => attr(node, 'class') === 'limits').length, 2);
  assert.equal(all.filter(node => node.tagName === 'blockquote').length, 1);
  assert.ok(all.some(node => attr(node, 'aria-label') === 'Таблица 1' && attr(node, 'tabindex') === '0'));
  assert.equal(all.filter(node => attr(node, 'class') === 'publication').length, 5);
  assert.equal(all.filter(node => attr(node, 'class') === 'book-figure').length, figures ? 3 : 0);
  assert.equal(all.filter(node => node.tagName === 'img' && attr(node, 'src')?.startsWith('data:image/svg+xml;base64,')).length, figures ? 3 : 0);
  const reference = all.find(node => attr(node, 'class') === 'chapter-reference');
  assert.equal(visibleText(reference).trim(), 'Источник: глава 02 "Swarma целиком", раздел "Имена и участники"; глава 08 "Допуск к носителю"');
  assert.ok(all.some(node => attr(node, 'href') === '/ru/book/#ch08'));
  assert.equal(html.includes('href="undefined"'), false);
  run('status-language', root); run('names', root); run('identifiers', root); run('publication-surface', root);
  const browser = spawnSync(process.execPath, [join(repository, 'scripts/checks/a11y.mjs'), '--route=/ru/platform/'], { cwd: root, encoding: 'utf8', timeout: 120000 });
  assert.equal(browser.status, 0, browser.stdout + browser.stderr);
  const report = JSON.parse(await readFile(join(root, '.temp/a11y/report.json'), 'utf8'));
  assert.equal(report.scans.length, 6);
  await mkdir(join(repository, '.temp'), { recursive: true });
  await writeFile(join(repository, `.temp/conventions-a11y-${figures ? 'figures' : 'default'}.json`), JSON.stringify(report, null, 2) + '\n');
  if (!figures) {
    // The geometry gate covers both locale headers and rejects an intentionally overlapping navigation.
    for (const [argument, exit, diagnostic] of [['--geometry', 0, /0 overlaps/], ['--geometry-control', 1, /header-geometry:/]]) {
      const geometry = spawnSync(process.execPath, [join(repository, 'scripts/checks/a11y.mjs'), argument], { cwd: root, encoding: 'utf8', timeout: 120000 });
      assert.equal(geometry.status, exit, geometry.stdout + geometry.stderr);
      assert.match(geometry.stdout + geometry.stderr, diagnostic);
    }
  }
  if (figures) {
    const images = all.filter(node => node.tagName === 'img' && attr(node, 'src')?.startsWith('data:image/svg+xml;base64,'));
    for (const [index, name] of ['three-layers', 'protocol-topology', 'sublayers'].entries()) assert.deepEqual(Buffer.from(attr(images[index], 'src').split(',')[1], 'base64'), await readFile(join(root, `src/assets/book-figures/${name}.svg`)));
    // The same checkout must not reuse a private rendering when its build flag is removed.
    build(root, false);
    const publicHtml = await readFile(join(root, 'dist/ru/platform/index.html'), 'utf8');
    assert.equal(publicHtml.includes('book-figure'), false);
    assert.equal(publicHtml.includes('data:image/svg+xml'), false);
  } else assert.equal(html.includes('figure-ground'), false);
});
// Each malformed convention fails the actual Astro build with the intended reason, file and source line.
for (const [name, extra, body, diagnostic] of [
  ['malformed reference', '', 'Источник: глава 02 без кавычек', 'malformed-reference'],
  ['wrong chapter title', '', 'Источник: глава 02 "Другое название"', 'chapter-reference-mismatch'],
  ['wrong printed number', '', 'Источник: глава 08 "Запуск агента и хост сессий"', 'chapter-reference-mismatch'],
  ['unknown section', '', 'Источник: глава 02 "Swarma целиком", раздел "Нет такого раздела"', 'chapter-reference-mismatch'],
  ['status marker forbidden', '', '[[status]]', 'status-forbidden'],
  ['malformed repository marker', '', '[[repos extra]]', 'malformed-marker'],
  ['unknown figure when disabled', '', '[[figure missing-figure]]', 'unknown-figure'],
]) test(`conventions: ${name}`, async t => { const root = await sourceFixture(t, content(extra, body)); build(root, false, diagnostic); });
// A recognised immutable font is binary data; a changed or disguised font cannot gain a text-policy exemption.
test('fonts: immutable binary and changed-file control', async t => {
  const path = 'public/fonts/pt-mono/pt-mono-latin-400-normal.woff2';
  const manifest = JSON.parse(await readFile(join(repository, 'src/data/font-assets.json'), 'utf8'));
  const data = await readFile(join(repository, path));
  const root = await fixture(t, { 'src/data/font-assets.json': JSON.stringify(manifest) });
  await put(root, path, data);
  assert.equal(await approvedFont(root, path, data), true);
  run('identifiers', root);
  const changed = Buffer.concat([data, Buffer.from('\n~/hidden\n')]);
  await put(root, path, changed);
  assert.equal(await approvedFont(root, path, changed), false);
  run('identifiers', root, 'local-path');
});
// The shipped token matrix passes and the design system's known low-contrast pair fails specifically.
test('contrast: shipped pairs and low-pair control', () => {
  const args = ['-B', 'scripts/check_contrast.py', 'src/styles/tokens.css'];
  const good = spawnSync('python3', args, { cwd: repository, encoding: 'utf8' });
  assert.equal(good.status, 0, good.stdout + good.stderr); assert.match(good.stdout, /pairs: 2816, failures: 0/);
  const bad = spawnSync('python3', [...args, '--control'], { cwd: repository, encoding: 'utf8' });
  assert.equal(bad.status, 1, bad.stdout + bad.stderr); assert.match(bad.stdout + bad.stderr, /FAIL.*light.*text-faint/);
});

// The browser gate rejects a known missing alternative, rather than succeeding because no page was scanned.
test('a11y: known bad fixture fails for image-alt', () => {
  const result = spawnSync(process.execPath, ['scripts/checks/a11y.mjs', '--control'], { cwd: repository, encoding: 'utf8', timeout: 60000 });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /a11y: \/control\/ 390 light default: image-alt/);
  assert.match(result.stdout, /1 scans, 1 violations/);
});

// A real English build renders approved references and repository rows without status, with live anchors.
test('conventions: English sources and repository rows', async t => {
  const root = await sourceFixture(t, content('', 'Описание.'));
  await put(root, 'src/content/pages/en/platform.md', page('', 'Architecture.\n\n## Sources\n\nSource: chapter 02 "Swarma as a whole", section "Names and participants"\n\n[[repos]]'));
  await put(root, 'src/content/pages/en/book.md', page('', 'The book.'));
  build(root);
  const html = await readFile(join(root, 'dist/en/platform/index.html'), 'utf8');
  assert.equal(nodes(document(html)).filter(node => attr(node, 'class') === 'repository-row').length, 13);
  assert.equal(html.includes('data-status-source'), false);
  assert.ok(html.includes('href="/en/book/#ch02"'));
  assert.ok((await readFile(join(root, 'dist/en/book/index.html'), 'utf8')).includes('id="ch02"'));
  const ids = nodes(document(html)).flatMap(node => attr(node, 'id') ? [attr(node, 'id')] : []);
  assert.equal(new Set(ids).size, ids.length);
  run('status-language', root); run('identifiers', root); run('names', root);
  assert.equal(html.includes('/werkstatt/'), false);
  assert.ok(html.includes('mailto:ivan@swarma.si'));
  // A same-checkout organisation move must refresh cached Markdown, with matching exact scan permissions.
  const configPath = join(root, 'config/site.json');
  const site = JSON.parse(await readFile(configPath, 'utf8'));
  await writeFile(configPath, JSON.stringify({ ...site, github_org: 'public-example' }));
  build(root);
  const moved = await readFile(join(root, 'dist/en/platform/index.html'), 'utf8');
  assert.ok(moved.includes('https://github.com/public-example/curator'));
  assert.equal(moved.includes('https://github.com/relux-works/'), false);
  run('identifiers', root);
  const bad = join(root, 'src/content/pages/en/platform.md');
  await writeFile(bad, page('', 'Source: chapter 02 "Wrong"'));
  build(root, false, 'chapter-reference-mismatch');
});

// Removed frontmatter cannot pass a direct Astro build; schema rejection names each unsupported key.
for (const field of ['status_rows: [swarma]', 'status_table: full']) test(`build: removed frontmatter rejects ${field.split(':')[0]}`, async t => {
  const root = await sourceFixture(t, content(field, 'Описание.'));
  const result = spawnSync(process.execPath, [join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root], { cwd: root, encoding: 'utf8', timeout: 60000 });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /Unrecognized key/);
  assert.ok((result.stdout + result.stderr).includes(field.split(':')[0]));
});

// A real public-to-dist build cannot publish a renamed original diagram with the switch off.
test('build: public diagram copy fails the output gate', async t => {
  const root = await sourceFixture(t, content('', 'Описание.'));
  const svg = await readFile(join(root, 'src/assets/book-figures/three-layers.svg'));
  await put(root, 'public/copied-diagram.svg', svg);
  build(root, false);
  assert.deepEqual(await readFile(join(root, 'dist/copied-diagram.svg')), svg);
  const { check } = await import('../figure-publication.mjs');
  assert.ok((await check(root, ['--off'])).includes('dist/copied-diagram.svg: figure-publication'));
});
