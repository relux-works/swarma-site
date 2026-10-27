import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { fixture, put, run } from './fixture.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
const policy = await readFile(join(repository, 'config/deployment-files.json'), 'utf8');
const headers = await readFile(join(repository, 'public/_headers'), 'utf8');
async function controls(t) {
  const root = await fixture(t, {
    'config/deployment-files.json': policy,
    'public/_headers': headers, 'dist/_headers': headers,
    'src/content/pages/ru/index.md': 'Swarma Protocol',
    'dist/index.html': '<p>Swarma Protocol</p>',
  });
  for (const entry of JSON.parse(policy).allow) await put(root, entry.path, await readFile(join(repository, entry.path.replace(/^dist\//u, 'public/'))));
  return root;
}

// The actual CLI accepts all exact source/output bytes and rejects changed content even without a remaining product name.
test('names deployment pins reject changed source and output metadata', async t => {
  const root = await controls(t);
  run('names', root);
  for (const entry of JSON.parse(policy).allow) {
    const original = await readFile(join(root, entry.path));
    for (const changed of [Buffer.concat([original, Buffer.from('\n')]), Buffer.from('{}')]) {
      await put(root, entry.path, changed);
      run('names', root, 'deployment-machine-file');
      assert.deepEqual(await readFile(join(root, entry.path)), changed);
    }
    await put(root, entry.path, original);
    run('names', root);
  }
});

// Machine allowances never reach page prose, decoded attributes or neighboring metadata paths.
test('names deployment allowances leave page and neighbor plants forbidden', async t => {
  const root = await controls(t);
  run('names', root);
  const pages = [
    ['src/content/pages/ru/index.md', 'Matrix', 'Swarma Protocol'],
    ['src/content/pages/ru/index.md', 'Ma**tr**ix', 'Swarma Protocol'],
    ['dist/index.html', '<p>Matrix</p>', '<p>Swarma Protocol</p>'],
    ['dist/index.html', '<img alt="Ma&#116;rix" src="/brand.svg">', '<p>Swarma Protocol</p>'],
  ];
  for (const [path, plant, clean] of pages) {
    await put(root, path, plant); run('names', root, 'infrastructure-product');
    assert.equal(await readFile(join(root, path), 'utf8'), plant);
    await put(root, path, clean); run('names', root);
  }
  const { rm } = await import('node:fs/promises');
  for (const path of ['public/.well-known/matrix/server-copy', 'dist/.well-known/matrix/client-copy', 'public/.well-known/other/server']) {
    await put(root, path, '{"protocol":"Matrix"}'); run('names', root, 'infrastructure-product');
    await rm(join(root, path)); run('names', root);
  }
});

// Exactly one protocol selector line per header file is allowed; duplicate selectors and second product-name lines reject.
test('names deployment header exception applies to one exact line only', async t => {
  const root = await controls(t);
  run('names', root);
  for (const path of ['public/_headers', 'dist/_headers']) {
    for (const plant of [headers + '\n  X-Protocol: Matrix\n', headers + '\n/.well-known/matrix/*\n', headers.replace('/.well-known/matrix/*', '/.well-known/matrix/other')]) {
      await put(root, path, plant); run('names', root, 'infrastructure-product');
      assert.equal(await readFile(join(root, path), 'utf8'), plant);
    }
    await put(root, path, headers); run('names', root);
  }
});

// Invalid pin policy cannot widen the exceptions; valid policy beside the plants still passes.
test('names deployment configuration rejects widened paths and selector lines', async t => {
  const root = await controls(t);
  run('names', root);
  for (const change of [value => { value.allow[0].path = 'public/*'; },
    value => { value.allow[0].path = 'public/.well-known/other/server'; },
    value => { value.headerSelectors[0].line = '/.well-known/other/*'; },
    value => { value.headerSelectors[0].paths.push('dist/index.html'); }]) {
    const value = JSON.parse(policy); change(value);
    await put(root, 'config/deployment-files.json', JSON.stringify(value));
    run('names', root, 'deployment-config');
  }
  await put(root, 'config/deployment-files.json', policy); run('names', root);
});
