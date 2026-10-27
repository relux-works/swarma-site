import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixture, put, run } from './fixture.mjs';
import { publicationReader } from '../publication-values.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
async function controls(t) {
  const policy = await readFile(join(repository, 'config/deployment-files.json'), 'utf8');
  const headers = await readFile(join(repository, 'public/_headers'), 'utf8');
  const root = await fixture(t, {
    'config/deployment-files.json': policy, 'public/_headers': headers, 'dist/_headers': headers,
    'public/clean.txt': 'Transport', 'dist/clean.txt': 'Transport',
  });
  for (const entry of JSON.parse(policy).allow) await put(root, entry.path, await readFile(join(repository, entry.path.replace(/^dist\//u, 'public/'))));
  return root;
}

// Unsupported file forms reject before content interpretation; supported neutral neighbors and restored trees pass.
for (const [name, suffix, bytes] of [
  ['extensionless escaped JSON', '.well-known/other/client', String.raw`{"protocol":"Ma\u0074rix"}`],
  ['unknown extension', 'nested/probe.unknown', '<input>'],
  ['unknown binary extension', 'nested/probe.bin', Buffer.from([255, 0])],
]) test(`publication file types reject ${name}`, async t => {
  const root = await controls(t); run('publication-surface', root);
  for (const prefix of ['public', 'dist']) {
    const path = `${prefix}/${suffix}`;
    await put(root, path, bytes);
    const result = run('publication-surface', root, 'publication-file-type');
    assert.equal(result.stderr.trim(), `${path}: publication-file-type`);
    assert.deepEqual(await readFile(join(root, path)), Buffer.from(bytes));
    await rm(join(root, path)); run('publication-surface', root);
  }
});

// Path exceptions are exact, including hidden metadata and header-like names; bytes cannot grant an exception.
test('publication file types reject neighboring exception paths', async t => {
  const root = await controls(t); run('publication-surface', root); run('names', root);
  for (const prefix of ['public', 'dist']) for (const suffix of [
    '.well-known/matrix/third', '.well-known/other/client', '.well-known/matrix/third.json', '.well-known/matrix/third.js', '.well-known/other/client.json', 'nested/client', '_headers-copy', 'nested/_headers', 'probe.html.unknown',
  ]) {
    const path = `${prefix}/${suffix}`;
    for (const bytes of ['{"protocol":"Transport"}', '{"protocol":"Matrix"}', String.raw`{"protocol":"Ma\u0074rix"}`]) {
      await put(root, path, bytes);
      const result = run('publication-surface', root, 'publication-file-type');
      assert.equal(result.stderr.trim(), `${path}: publication-file-type`);
      assert.equal(await readFile(join(root, path), 'utf8'), bytes);
    }
    await rm(join(root, path)); run('publication-surface', root);
  }
  // A format exception never exempts changed machine payloads from their existing content hashes.
  for (const prefix of ['public', 'dist']) {
    const path = `${prefix}/.well-known/matrix/client`, original = await readFile(join(root, path));
    await put(root, path, '{}'); run('names', root, 'deployment-machine-file');
    await put(root, path, original); run('publication-surface', root); run('names', root);
  }
});

// Supported parser types reject malformed inputs; restored valid inputs still pass the same CLI.
test('publication file types require their decoded readers', async t => {
  const root = await controls(t);
  for (const prefix of ['public', 'dist']) for (const [suffix, clean, bad] of [
    ['json', '{"name":"Swarma"}', '{"name":'],
    ['webmanifest', '{"name":"Swarma"}', '{"name":'],
    ['css', 'p { color: black; }', 'p { content: "unterminated; }'],
    ['svg', '<svg xmlns="http://www.w3.org/2000/svg"><text>Swarma</text></svg>', '<svg xmlns="http://www.w3.org/2000/svg"><text>Swarma</svg>'],
  ]) {
    const path = `${prefix}/reader.${suffix}`;
    await put(root, path, clean); run('publication-surface', root);
    await put(root, path, bad); run('publication-surface', root, 'publication-decode');
    await put(root, path, clean); run('publication-surface', root);
    await rm(join(root, path));
  }
  const reader = await publicationReader(root);
  try {
    // Web manifests and the exact extensionless machine paths share whole-file JSON string/key decoding.
    for (const path of ['public/reader.webmanifest', 'dist/reader.webmanifest', 'public/.well-known/matrix/client', 'dist/.well-known/matrix/server']) {
      const decoded = await reader.values(path, String.raw`{"Ma\u0074rix":"Tran\u0073port"}`);
      assert.ok(decoded.values.includes('Matrix')); assert.ok(decoded.values.includes('Transport'));
    }
    for (const [path, text] of [['public/reader.html', '<p>Swar&#109;a</p>'], ['dist/reader.svg', '<svg xmlns="http://www.w3.org/2000/svg"><text>Swar&#109;a</text></svg>']]) {
      assert.ok((await reader.values(path, text)).values.includes('Swarma'));
    }
  } finally { await reader.close(); }
});

// A supported image must retain its existing binary signature check; renaming text cannot bypass decoding.
test('publication file types retain binary signature checks', async t => {
  const root = await controls(t), png = await readFile(join(repository, 'public/brand/icon-192.png'));
  for (const prefix of ['public', 'dist']) {
    const path = `${prefix}/image.png`;
    await put(root, path, png); run('publication-surface', root);
    await put(root, path, 'Transport'); run('publication-surface', root, 'publication-decode');
    await put(root, path, png); run('publication-surface', root);
  }
});

// Case variants reject by path before decoding; lowercase neutral controls and restored trees pass in both stages.
test('publication file types require lowercase extension spelling', async t => {
  const root = await controls(t);
  const cases = [
    ['md', ['MD', 'Md'], 'Swarma **Protocol**', ['Swarm **Signer**', 'Swarm Signer', '<input>']],
    ['svg', ['SVG'], '<svg xmlns="http://www.w3.org/2000/svg"><text>Swarma</text></svg>', ['<svg>', '<input>']],
    ['json', ['Json'], '{"name":"Swarma"}', ['{"name":', '<input>']],
  ];
  for (const prefix of ['public', 'dist']) for (const [suffix, variants, clean, plants] of cases) {
    const lower = `${prefix}/case-probe.${suffix}`;
    await put(root, lower, clean); run('publication-surface', root); run('names', root);
    if (suffix === 'md') {
      for (const text of ['Swarm **Signer**', 'Swarm Signer']) {
        await put(root, lower, text); run('names', root, 'canonical-name');
      }
      await put(root, lower, clean); run('names', root);
    }
    await rm(join(root, lower));
    for (const variant of variants) {
      const path = `${prefix}/case-probe.${variant}`;
      for (const bytes of [clean, ...plants]) {
        await put(root, path, bytes);
        const result = run('publication-surface', root, 'publication-file-type');
        assert.equal(result.stderr.trim(), `${path}: publication-file-type`);
        assert.equal(await readFile(join(root, path), 'utf8'), bytes);
      }
      await rm(join(root, path)); run('publication-surface', root);
    }
  }
});
