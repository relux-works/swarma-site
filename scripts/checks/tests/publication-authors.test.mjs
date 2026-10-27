import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { publicationEntries } from '../../../src/lib/markdown-conventions.mjs';
import { loadData } from '../../../src/lib/content-data.mjs';
import { document, filesAt, visibleText } from '../lib.mjs';
import { fixture, put, page } from './fixture.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
const expected = { ru: 'Алексей Григорьев, Иван Опарин', en: 'Alexey Grigorev, Ivan Oparin' };
const nodes = node => [node, ...(node.childNodes ?? []).flatMap(nodes)];
function authors(html, lang) {
  return nodes(document(html)).filter(node => node.tagName === 'article').map(article => {
    const list = article.childNodes.find(node => node.tagName === 'dl');
    const row = list.childNodes.find(node => node.tagName === 'div');
    assert.equal(visibleText(row.childNodes.find(node => node.tagName === 'dt')).trim(), lang === 'ru' ? 'Авторы' : 'Authors');
    return visibleText(row.childNodes.find(node => node.tagName === 'dd')).trim();
  });
}
function verify(html, kind, lang) {
  assert.deepEqual(authors(html, lang), Array(kind === 'book' ? 1 : 4).fill(expected[lang]));
}

// All five entries select their own locale. Each missing, empty, non-list or blank-name list
// rejects for the exact entry/locale diagnostic, then restoration passes without cross-language fallback.
test('publications: localized authors and invalid-list controls', () => {
  const data = loadData('publications');
  for (const kind of ['book', 'papers']) for (const lang of ['ru', 'en']) {
    verify(publicationEntries(kind, lang), kind, lang);
    for (const entry of kind === 'book' ? [data.book] : data.papers) {
      const original = entry.authors[lang];
      for (const value of [undefined, [], expected[lang], ['']]) {
        try {
          if (value === undefined) delete entry.authors[lang];
          else entry.authors[lang] = value;
          assert.throws(() => publicationEntries(kind, lang), error => error.message === `publication-authors: ${entry.id} (${lang})`);
        } finally { entry.authors[lang] = original; }
        verify(publicationEntries(kind, lang), kind, lang);
      }
    }
  }
});

function build(root, entry) {
  const result = spawnSync(process.execPath, [join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root],
    { cwd: root, encoding: 'utf8', timeout: 60000, env: { ...process.env, SWARMA_BOOK_FIGURES: '0' } });
  assert.ifError(result.error);
  const output = result.stdout + result.stderr;
  assert.equal(result.status, entry ? 1 : 0, output);
  if (entry) {
    assert.ok(output.includes(`publication-authors: ${entry} (en)`), output);
    assert.ok(!output.includes('generating static routes'), output);
  }
}
async function russianPages(root) {
  return Object.fromEntries(await Promise.all((await filesAt(root, 'dist/ru')).filter(path => path.endsWith('.html')).map(async path =>
    [path.slice(join(root, 'dist').length), createHash('sha256').update(await readFile(path)).digest('hex')])));
}

// Actual Astro pages show the requested names in each locale. Missing English lists fail after
// a successful cached build for both entry kinds; restoring data preserves every Russian HTML byte.
test('publications: real bilingual builds reject missing English authors', async t => {
  const root = await fixture(t);
  for (const path of ['src', 'public', 'config', 'scripts', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(join(repository, path), join(root, path), { recursive: true, filter: path => path !== join(repository, 'scripts/checks/tests') });
  }
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  await rm(join(root, 'src/content/pages/en'), { recursive: true, force: true });
  await put(root, 'src/content/pages/en/index.md', page('', 'Swarma.'));
  for (const lang of ['ru', 'en']) for (const kind of ['book', 'papers']) {
    await put(root, `src/content/pages/${lang}/${kind}.md`, page('', `[[publications ${kind}]]`));
  }
  build(root);
  for (const lang of ['ru', 'en']) for (const kind of ['book', 'papers']) {
    const html = await readFile(join(root, `dist/${lang}/${kind}/index.html`), 'utf8');
    verify(html, kind, lang);
    const footer = visibleText(nodes(document(html)).find(node => node.tagName === 'footer'));
    assert.ok(footer.includes(expected[lang]));
    assert.ok(!footer.includes(expected[lang === 'ru' ? 'en' : 'ru']));
  }
  const baseline = await russianPages(root);
  const path = join(root, 'src/data/publications.json'), original = await readFile(path, 'utf8');
  for (const kind of ['book', 'papers']) {
    const data = JSON.parse(original), entry = kind === 'book' ? data.book : data.papers[0];
    delete entry.authors.en;
    await writeFile(path, JSON.stringify(data));
    build(root, entry.id);
    await writeFile(path, original);
    build(root);
    assert.deepEqual(await russianPages(root), baseline);
    verify(await readFile(join(root, `dist/en/${kind}/index.html`), 'utf8'), kind, 'en');
  }
});
