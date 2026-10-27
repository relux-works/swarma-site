import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fixture, put, run } from './fixture.mjs';
import { check as noStatus } from '../no-status.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
const neutral = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="64"><g class="status-chipset" data-state="neutral"><rect width="480" height="64" fill="white"/><text x="8" y="36">Swarma Runtime</text></g></svg>';
const status = neutral.replace('class="status-chipset"', 'class="note status-chip"').replace('>Swarma Runtime<', '>Swarma Runtime: решено<');

// Public and built SVG use Chromium's XML DOM, including uppercase extensions and decoded class tokens.
// Invalid XML/encoding rejects for publication-decode; nearby neutral files remain permitted.
test('no-status: standalone SVG inspection rejects status UI and invalid documents', async t => {
  const paths = ['public/badge.svg', 'dist/badge.svg', 'dist/upper.SVG'];
  const root = await fixture(t);
  for (const path of paths) await put(root, path, neutral);
  assert.deepEqual(await noStatus(root), []);
  for (const [path, attribute] of [
    [paths[0], 'class="note status-chip extra"'],
    [paths[1], 'data-status-row="part"'],
    [paths[2], 'class="status&#45;table"'],
  ]) {
    await put(root, path, neutral.replace('class="status-chipset"', attribute));
    assert.deepEqual(await noStatus(root), [`${path}: status-forbidden`], path);
    await put(root, path, neutral);
    assert.deepEqual(await noStatus(root), []);
  }
  for (const bytes of ['<svg xmlns="http://www.w3.org/2000/svg"><text>Diagram</svg>', Buffer.from([255])]) {
    await put(root, paths[1], bytes);
    run('no-status', root, 'publication-decode');
  }
  await put(root, paths[1], neutral);
  run('no-status', root);
});

async function sourceFixture(t) {
  const root = await fixture(t);
  for (const path of ['src', 'public', 'config', 'scripts', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(join(repository, path), join(root, path), { recursive: true, filter: path => path !== join(repository, 'scripts/checks/tests') });
  }
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  return root;
}

// Real image/background builds accept a neutral SVG and reject its status chip before replacing clean output.
// Supervised Astro-only builds supply separate dist witnesses; the publication-surface gate forbids objects.
test('no-status: image and CSS-background SVG builds reject beside neutral controls', async t => {
  const root = await sourceFixture(t), evidence = [];
  const mode = process.env.SWARMA_BOOK_FIGURES ?? '0';
  const env = { ...process.env, IDENT_DENY_TOKENS: 'zz-host-alpha', SWARMA_BOOK_FIGURES: mode };
  const layoutPath = 'src/layouts/Page.astro';
  const layout = await readFile(join(root, layoutPath), 'utf8');
  const build = (raw = false) => {
    const args = raw ? [process.execPath, 'node_modules/astro/bin/astro.mjs', 'build'] : ['npm', 'run', 'build'];
    const result = spawnSync(process.execPath, ['scripts/run.mjs', ...args], { cwd: root, env, encoding: 'utf8', timeout: 120000 });
    assert.ifError(result.error);
    return result;
  };
  const embeddings = [
    ['img', '<img src="/badge.svg" alt="Platform diagram" />'],
    ['css-background', '<div style="width:480px;height:64px;background-image:url(/badge.svg)">Diagram</div>'],
  ];
  for (const [kind, markup] of embeddings) {
    await put(root, layoutPath, layout.replace('<slot />', `<slot />${markup}`));
    await put(root, 'public/badge.svg', neutral);
    let result = build();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(await readFile(join(root, 'dist/badge.svg'), 'utf8'), neutral);
    assert.match(await readFile(join(root, 'dist/ru/platform/index.html'), 'utf8'), /\/badge\.svg/u);
    const previous = await readFile(join(root, 'dist/index.html'));
    await put(root, 'public/badge.svg', status);
    result = build();
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /public\/badge\.svg: status-forbidden/u);
    assert.equal(await readFile(join(root, 'dist/badge.svg'), 'utf8'), neutral);
    assert.deepEqual(await readFile(join(root, 'dist/index.html')), previous);
    // Intentionally bypass npm lifecycle gates in this isolated fixture to exercise the output reader independently.
    result = build(true);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(await readFile(join(root, 'dist/badge.svg'), 'utf8'), status);
    await put(root, 'public/badge.svg', neutral);
    const artifact = run('no-status', root, 'status-forbidden');
    assert.equal(artifact.stderr.trim(), 'dist/badge.svg: status-forbidden');
    evidence.push({ kind, figures: mode, neutralBuildExit: 0, statusBuildExit: 1, diagnostic: 'public/badge.svg: status-forbidden', previousOutputPreserved: true,
      isolatedAstroBuildExit: 0, artifactCheckExit: artifact.status, artifactDiagnostic: artifact.stderr.trim() });
    // Restore the deliberately polluted output before the next independent clean build.
    await put(root, 'dist/badge.svg', neutral);
  }
  let result = build();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  await put(root, layoutPath, layout.replace('<slot />', '<slot /><object data="/badge.svg" type="image/svg+xml">Diagram</object>'));
  result = build(true);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(await readFile(join(root, 'dist/ru/platform/index.html'), 'utf8'), /<object\b[^>]*data="\/badge\.svg"/u);
  const object = run('publication-surface', root, 'publication-object');
  assert.ok(object.stderr.split('\n').includes('dist/ru/platform/index.html: publication-object'));
  evidence.push({ kind: 'object', figures: mode, neutralSvg: true, isolatedAstroBuildExit: 0, publicationCheckExit: object.status, diagnostic: 'dist/ru/platform/index.html: publication-object' });
  await put(repository, '.temp/no-status-svg-evidence.json', JSON.stringify(evidence, null, 2));
});
