import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixture, put, run } from './fixture.mjs';
import { chapterReferences } from '../../../src/lib/markdown-conventions.mjs';
import { repositoryEntries } from '../../../src/lib/repository-render.mjs';
import { document, visibleText } from '../lib.mjs';

// English references use only the approved translated titles/sections, with Russian validation preserved.
test('references: bilingual positive controls and mismatched languages', () => {
  assert.match(chapterReferences('Source: chapter 02 "Swarma as a whole", section "Names and participants"; chapter 08 "Carrier admission"', 'en'), /href="\/en\/book\/#ch08"/);
  assert.match(chapterReferences('Источник: глава 02 "Swarma целиком", раздел "Имена и участники"', 'ru'), /href="\/ru\/book\/#ch02"/);
  for (const value of ['Source: chapter 02 "Swarma целиком"', 'Source: chapter 02 "Swarma as a whole", section "Unknown"', 'Source: chapter 08 "Agent launch and the session host"']) {
    assert.throws(() => chapterReferences(value, 'en'), /chapter-reference-mismatch/);
  }
  assert.throws(() => chapterReferences('Source: chapter 02 without quotes', 'en'), /malformed-reference/);
});

// Repository rows contain exactly the configured name, description and link, without delivery state.
test('repositories: configured links and descriptions only', () => {
  const html = repositoryEntries('ru');
  assert.equal((html.match(/class="repository-row"/g) ?? []).length, 13);
  assert.match(html, /https:\/\/github.com\/relux-works\/swarma-pool/);
  for (const lang of ['ru', 'en']) assert.equal(/data-status-|status-chip|<table/.test(repositoryEntries(lang)), false);
  const none = repositoryEntries('en', { site: { github_org: 'public-example' }, repositories: [{ name: 'module', description_key: 'curator' }] });
  assert.match(none, /https:\/\/github.com\/public-example\/module/);
  assert.throws(() => repositoryEntries('ru', { repositories: [{ name: 'module', description_key: 'missing' }] }), /unknown-repository-description/);
});

// Only config-derived exact repository URLs/contact pass; prefix, alternate org, path/query and encoded plants fail.
test('identifiers: config-derived public values with narrow negative controls', async t => {
  const root = await fixture(t, {
    'config/site.json': JSON.stringify({ github_org: 'public-example', contact_email: 'contact@example.org' }),
    'config/repos.json': JSON.stringify([{ name: 'module', description_key: 'module' }]),
    'src/probe.html': '<a href="https://github.com/public-example/module">Module</a><a href="mailto:contact&#64;example.org">Contact</a>',
  });
  run('identifiers', root);
  for (const value of ['https://github.com/public-example/module-extra', 'https://github.com/relux-works/module', 'https://github.com/public-example/module/private', 'https://github.com/public-example/module?token=x', 'https://github.com/public-example/&#112;rivate']) {
    await put(root, 'src/probe.html', `<a href="${value}">Source</a>`);
    run('identifiers', root, 'private-repository');
  }
  await put(root, 'src/probe.html', 'other@example.org');
  run('identifiers', root, 'email');
  await put(root, 'src/probe.html', 'contact@example.org');
  run('identifiers', root);
});

// Missing organisation and duplicate repository names cannot silently expand or misbuild the public allowlist.
test('identifiers: invalid configuration is rejected with a named diagnostic', async t => {
  const root = await fixture(t);
  await put(root, 'config/site.json', JSON.stringify({ contact_email: 'contact@example.org' }));
  run('identifiers', root, 'identifier-allowlist');
  await put(root, 'config/site.json', JSON.stringify({ github_org: 'public-example', contact_email: 'contact@example.org' }));
  const repo = { name: 'module', description_key: 'module' };
  await put(root, 'config/repos.json', JSON.stringify([repo, repo]));
  run('identifiers', root, 'identifier-allowlist');
  await put(root, 'config/repos.json', JSON.stringify([repo]));
  run('identifiers', root);
});

// Only accepted translations enter English reference validation; the complete Russian catalogue stays available.
test('references: accepted English subset replaces earlier proposals', async () => {
  const catalog = JSON.parse(await readFile(new URL('../../../src/data/book-chapters.json', import.meta.url), 'utf8'));
  assert.equal(catalog.filter(chapter => chapter.title_en).length, 31);
  assert.equal(catalog.flatMap(chapter => chapter.sections).filter(section => section.en).length, 64);
  assert.match(chapterReferences('Source: chapter 05 "Keys and the key holder", section "The kernel establishes the peer"', 'en'), /ch05/);
  assert.throws(() => chapterReferences('Source: chapter 00 "Who this book is for", section "Design and readiness"', 'en'), /chapter-reference-mismatch/);
  assert.match(chapterReferences('Источник: глава 00 "Для кого эта книга", раздел "Дизайн и готовность"', 'ru'), /ch00/);
});
