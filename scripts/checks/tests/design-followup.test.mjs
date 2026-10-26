import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixture, put, run } from './fixture.mjs';
import { infrastructureProducts, infrastructureRules } from '../names.mjs';
import { check as contrast } from '../contrast.mjs';
import { check as noStatus } from '../no-status.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
// No source marker, legacy key, rendered chip or deleted route can reintroduce delivery-state UI.
test('no-status: positive control and rejected legacy surfaces', async t => {
  const root = await fixture(t, { 'src/content/pages/ru/index.md': 'Swarma Runtime', 'dist/index.html': '<p>Swarma</p>' });
  run('no-status', root);
  for (const plant of ['[[status]]', 'status_rows: []', '"status_rows": []', 'status_table: full', '<span class="status-chip">Text</span>', '<a href="/en/status/">State</a>']) {
    await put(root, 'src/content/pages/ru/index.md', plant); run('no-status', root, 'status-forbidden');
  }
  await put(root, 'src/content/pages/ru/index.md', 'Swarma');
  await put(root, 'dist/en/status/index.html', '<p>Text</p>'); run('no-status', root, 'status-forbidden');
});
// Every documented infrastructure spelling is rejected; approved harness and neighboring ordinary words pass.
test('names: infrastructure list and approved harness controls', async t => {
  for (const name of infrastructureProducts) assert.deepEqual(infrastructureRules(`Transport: ${name}.`), ['infrastructure-product']);
  for (const word of ['Claude Code', 'Codex', 'SSH', 'Xcode', 'Matrixed', 'elementary']) assert.deepEqual(infrastructureRules(word), []);
  const root = await fixture(t, { 'src/content/pages/ru/index.md': 'Claude Code и Codex' }); run('names', root);
  await put(root, 'src/content/pages/ru/index.md', 'Ma**tr**ix'); run('names', root, 'infrastructure-product');
  await put(root, 'src/content/pages/ru/index.md', 'Transport');
  await put(root, 'dist/index.html', '<p>Ma<em>tr</em>ix</p>'); run('names', root, 'infrastructure-product');
});
// All approved copied bytes pass; one appended byte fails the integrity gate for that exact asset.
test('brand: pinned owner manifest and changed-byte control', async t => {
  const root = await fixture(t);
  await cp(join(repository, 'public/brand'), join(root, 'public/brand'), { recursive: true });
  await put(root, 'src/data/brand-assets.json', await readFile(join(repository, 'src/data/brand-assets.json')));
  run('brand-assets', root);
  const path = 'public/brand/favicon.svg';
  await put(root, path, Buffer.concat([await readFile(join(root, path)), Buffer.from(' ')]));
  run('brand-assets', root, 'brand-integrity');
});
// A public build rejects copied, embedded/base64, inline geometry and hash representations of every book diagram.
test('figures: disabled output gate with copied and embedded controls', async t => {
  const root = await fixture(t);
  await cp(join(repository, 'src/assets/book-figures'), join(root, 'src/assets/book-figures'), { recursive: true });
  await put(root, 'dist/index.html', '<p>Swarma</p>'); run('figure-publication', root);
  for (const name of ['three-layers', 'protocol-topology', 'sublayers']) {
    const svg = await readFile(join(root, `src/assets/book-figures/${name}.svg`));
    for (const data of [svg, `<img src="data:image/svg+xml;base64,${svg.toString('base64')}">`, svg.toString().replace(/\s+/g, ' ')]) {
      await put(root, 'dist/copied.txt', data);
      const result = await import('../figure-publication.mjs').then(m => m.check(root, ['--off']));
      assert.ok(result.some(error => error.endsWith(': figure-publication')));
    }
  }
});
// Effective browser cascade and the source contract agree on a clean set; the reviewer's late alias fails at 1:1.
test('contrast: late semantic override rejects in actual CSS cascade', async t => {
  const root = await fixture(t);
  for (const name of ['check_computed_contrast.py', 'check_contrast.py']) await put(root, `scripts/${name}`, await readFile(join(repository, `scripts/${name}`)));
  const tokens = await readFile(join(repository, 'src/styles/tokens.css'), 'utf8');
  await contrast(root, { cssOverride: tokens });
  await assert.rejects(() => contrast(root, { cssOverride: tokens + '\n:root { --color-role-human-text: var(--color-role-human-fill); }' }), /FAIL light role-human-text on role-human-fill 1\.00/);
  // An ignored, comment-separated at-keyword must never repair a bad effective browser cascade.
  await assert.rejects(() => contrast(root, { cssOverride: tokens + '\n:root { --color-role-human-text: var(--color-role-human-fill); } @/**/media (prefers-color-scheme: light) { :root { --color-role-human-text: #24282e; } }' }), /FAIL light role-human-text on role-human-fill 1\.00/);
});

// Built DOM class tokens and data-attribute names decide the rule, independent of quoting, whitespace or entity spelling.
test('no-status: Chromium class and data attributes reject in built pages', async t => {
  const root = await fixture(t);
  const path = 'dist/index.html';
  await put(root, path, '<p class="status-chipset ordinary-note" data-state="neutral">Swarma</p>');
  assert.deepEqual(await noStatus(root), []);
  for (const attribute of ['class=status-chip', 'class = "status-chip"', 'class="note status-chip extra"',
    'class\n=\n"status-table"', 'class="status&#45;chip"', 'class="STATUS-CHIP"',
    'class=status-row', 'class=status-now', 'data-status-source', 'data-status-row = "part"',
    'data-status-table="all"', 'data-status-kind="legacy"', 'data-status']) {
    await put(root, path, `<p ${attribute}>Swarma</p>`);
    assert.deepEqual(await noStatus(root), ['dist/index.html: status-forbidden'], attribute);
  }
});
