import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as content from '../../../src/lib/content-data.mjs';
import { fixture, put, page } from './fixture.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));

// Whole-data validation rejects each invalid entry/locale, including entries no page renders.
// Restoration passes after every plant; chapter titles require the explicit locale fields.
test('eager: every author list and chapter title is mandatory', () => {
  const publications = content.loadData('publications'), chapters = content.loadData('book-chapters');
  assert.equal(typeof content.validateContentData, 'function');
  content.validateContentData();
  for (const entry of [publications.book, ...publications.papers]) for (const lang of ['ru', 'en']) {
    const original = entry.authors[lang];
    for (const value of [undefined, [], 'Invalid', [' ']]) {
      try {
        if (value === undefined) delete entry.authors[lang];
        else entry.authors[lang] = value;
        assert.throws(() => content.validateContentData(), error => error.message === `publication-authors: ${entry.id} (${lang})`);
      } finally { entry.authors[lang] = original; }
      content.validateContentData();
    }
  }
  for (const chapter of chapters) for (const lang of ['ru', 'en']) {
    const key = `title_${lang}`, original = chapter[key];
    for (const value of [undefined, '', 1, ' ']) {
      try {
        if (value === undefined) delete chapter[key];
        else chapter[key] = value;
        assert.throws(() => content.validateContentData(), error => error.message === `chapter-title: ${chapter.number} (${lang})`);
      } finally { chapter[key] = original; }
      content.validateContentData();
    }
  }
  const glossary = chapters.find(chapter => chapter.number === '31');
  assert.equal(glossary.title_ru, 'Словарь');
  assert.equal(glossary.title_en, 'Glossary');
});

function build(root, diagnostic) {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: root, encoding: 'utf8', timeout: 120000, env: process.env,
  });
  assert.ifError(result.error);
  const output = result.stdout + result.stderr;
  assert.equal(result.status, diagnostic ? 1 : 0, output);
  assert.ok(output.includes('prebuild'), output);
  if (diagnostic) {
    assert.ok(output.includes(diagnostic), output);
    assert.ok(!output.includes('generating static routes'), output);
  } else assert.ok(output.includes('postbuild'), output);
  return result.status;
}

// The complete npm build runs with only a Russian home: no EN page, publications or chapter TOC.
// Six specific startup rejections each follow a clean build and precede a successful restoration.
test('eager: full builds reject unrendered publication and chapter plants', async t => {
  const root = await fixture(t);
  for (const path of ['src', 'public', 'config', 'scripts', 'astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json']) {
    await cp(join(repository, path), join(root, path), { recursive: true, filter: path => path !== join(repository, 'scripts/checks/tests') });
  }
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  await rm(join(root, 'src/content/pages'), { recursive: true, force: true });
  await put(root, 'src/content/pages/ru/index.md', page());
  const publications = 'src/data/publications.json', chapters = 'src/data/book-chapters.json';
  const cases = [
    ['all English authors', publications, data => { for (const entry of [data.book, ...data.papers]) delete entry.authors.en; }, 'publication-authors: book (en)'],
    ['Russian paper authors', publications, data => { for (const entry of data.papers) delete entry.authors.ru; }, 'publication-authors: platform (ru)'],
    ['empty author list', publications, data => { data.book.authors.en = []; }, 'publication-authors: book (en)'],
    ['malformed author list', publications, data => { data.papers.at(-1).authors.en = 'Invalid'; }, 'publication-authors: status-appendix (en)'],
    ['missing Russian chapter title with legacy field', chapters, data => { const entry = data.find(chapter => chapter.number === '31'); entry.title = entry.title_ru; delete entry.title_ru; }, 'chapter-title: 31 (ru)'],
    ['missing English chapter title', chapters, data => { delete data.find(chapter => chapter.number === '31').title_en; }, 'chapter-title: 31 (en)'],
  ];
  const evidence = { figures: process.env.SWARMA_BOOK_FIGURES ?? '0', cleanExit: build(root), cases: [] };
  for (const [name, relative, plant, diagnostic] of cases) {
    const path = join(root, relative), original = await readFile(path, 'utf8'), data = JSON.parse(original);
    plant(data);
    await writeFile(path, JSON.stringify(data));
    const rejectedExit = build(root, diagnostic);
    await writeFile(path, original);
    const restoredExit = build(root);
    evidence.cases.push({ name, diagnostic, rejectedExit, restoredExit });
  }
  await put(repository, '.temp/data-integrity-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
});
