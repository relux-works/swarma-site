import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixture, put, run } from './fixture.mjs';
import { chapterReferences } from '../../../src/lib/markdown-conventions.mjs';
import { repositoryEntries } from '../../../src/lib/repository-render.mjs';
import { renderStatus } from '../../../src/lib/status-render.mjs';
import { verifiedRegions } from '../status-provenance.mjs';
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

// Both English table shapes retain every Russian source cell and exact provenance; translated/forged cells fail.
test('status: English headings and literal Russian cells with exact provenance', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const html = `<html lang="en"><body>${renderStatus({ ids: ['runtime-curator', 'part-023', 'part-024'], lang: 'en' })}</body></html>`;
  assert.ok(html.includes('Layer and capability'));
  assert.ok(html.includes('Quoted cells from the Russian edition'));
  assert.ok(html.includes('lang="ru"'));
  const canonical = JSON.parse(await readFile(`${root}/src/data/status/layer-map.ru.json`, 'utf8')).find(row => row.id === 'runtime-curator');
  assert.ok(visibleText(document(html)).includes(canonical.capability));
  assert.deepEqual((await verifiedRegions(root, html)).errors, []);
  assert.ok((await verifiedRegions(root, html.replace(canonical.capability, 'Invented capability'))).errors.includes('status-provenance'));
  assert.ok((await verifiedRegions(root, html.replace('Works today', 'All complete'))).errors.includes('status-provenance'));
  const full = `<html lang="en"><body>${renderStatus({ full: true, lang: 'en' })}</body></html>`;
  assert.deepEqual((await verifiedRegions(root, full)).errors, []);
});

// The repository list uses precisely 13 configured links and canonical status, including both pool part rows.
test('repositories: configured list, pool rows, no invented status', () => {
  const html = repositoryEntries('ru');
  assert.equal((html.match(/class="repository-row"/g) ?? []).length, 13);
  assert.match(html, /https:\/\/github.com\/relux-works\/swarma-pool/);
  assert.match(html, /Публичный пул для чужого кода/);
  assert.match(html, /Публичный пул: контракт класса/);
  assert.match(repositoryEntries('en'), /Quoted cells from the Russian edition/);
  const none = repositoryEntries('en', { site: { github_org: 'public-example' }, repositories: [{ name: 'module', description_key: 'curator', status_rows: [] }] });
  assert.match(none, /https:\/\/github.com\/public-example\/module/);
  assert.equal(none.includes('data-status-source'), false);
  assert.throws(() => repositoryEntries('ru', { repositories: [{ name: 'module', description_key: 'curator', status_rows: ['missing-row'] }] }), /unknown-status-id/);
  assert.throws(() => repositoryEntries('ru', { repositories: [{ name: 'module', description_key: 'missing', status_rows: [] }] }), /unknown-repository-description/);
});

// Only config-derived exact repository URLs/contact pass; prefix, alternate org, path/query and encoded plants fail.
test('identifiers: config-derived public values with narrow negative controls', async t => {
  const root = await fixture(t, {
    'config/site.json': JSON.stringify({ github_org: 'public-example', contact_email: 'contact@example.org' }),
    'config/repos.json': JSON.stringify([{ name: 'module', description_key: 'module', status_rows: [] }]),
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
  const repo = { name: 'module', description_key: 'module', status_rows: [] };
  await put(root, 'config/repos.json', JSON.stringify([repo, repo]));
  run('identifiers', root, 'identifier-allowlist');
  await put(root, 'config/repos.json', JSON.stringify([repo]));
  run('identifiers', root);
});
