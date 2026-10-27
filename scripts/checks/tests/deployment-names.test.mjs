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

const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="50">${body}</svg>`;
const neighborCases = [
  { name: 'JSON object value', suffix: 'json', clean: '{"protocol":"Transport"}',
    plants: ['{"protocol":"Matrix"}', String.raw`{"protocol":"Ma\u0074rix"}`] },
  { name: 'JSON nested key', suffix: 'json', clean: '{"metadata":{"transport":"role"}}',
    plants: ['{"metadata":{"Matrix":"role"}}', String.raw`{"metadata":{"Ma\u0074rix":"role"}}`] },
  { name: 'JSON root string', suffix: 'json', clean: '"Transport"',
    plants: ['"Matrix"', String.raw`"Ma\u0074rix"`] },
  { name: 'SVG rendered text', suffix: 'svg', clean: svg('<text x="10" y="32">Transport</text>'),
    plants: ['Matrix', 'Ma&#116;rix', 'Ma&#x74;rix'].map(value => svg(`<text x="10" y="32">${value}</text>`)) },
  { name: 'SVG accessible label', suffix: 'svg', clean: svg('<rect width="20" height="20" role="img" aria-label="Transport" />'),
    plants: ['Matrix', 'Ma&#116;rix'].map(value => svg(`<rect width="20" height="20" role="img" aria-label="${value}" />`)) },
];
// Shared whole-file JSON and standalone-SVG readers expose plain/escaped names at both publication stages; exact pins still pass.
for (const entry of neighborCases) test(`names decoded neighboring ${entry.name}`, async t => {
  const root = await controls(t);
  run('names', root);
  for (const prefix of ['public', 'dist']) {
    const path = `${prefix}/.well-known/other/protocol.${entry.suffix}`;
    await put(root, path, entry.clean); run('names', root);
    for (const plant of entry.plants) {
      await put(root, path, plant); run('names', root, 'infrastructure-product');
      assert.equal(await readFile(join(root, path), 'utf8'), plant);
      await put(root, path, entry.clean); run('names', root);
    }
  }
});
