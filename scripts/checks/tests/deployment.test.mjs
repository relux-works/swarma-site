import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { fixture, put } from './fixture.mjs';
import { check, deploymentFiles, parseHeaders, headersFor, staticServer, preparePage, inspectPage } from '../deployment.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
const policy = await readFile(join(repository, 'config/deployment-files.json'), 'utf8');
const headers = await readFile(join(repository, 'public/_headers'), 'utf8');
const metadata = {
  server: '{"m.server":"matrix.swarma.si:443"}',
  client: '{"m.homeserver":{"base_url":"https://matrix.swarma.si"}}',
};
async function pinnedFixture(t) {
  const root = await fixture(t, { 'config/deployment-files.json': policy });
  for (const prefix of ['public', 'dist']) for (const [name, content] of Object.entries(metadata)) {
    await put(root, `${prefix}/.well-known/matrix/${name}`, content);
  }
  return root;
}
const html = body => `<!doctype html><html lang="ru"><head><link rel="stylesheet" href="/site.css"></head><body>${body}</body></html>`;

// The exact approved source/output bytes pass; whitespace, changed contents and missing copies reject by the hash rule.
test('deployment metadata pins exact bytes at source and output paths', async t => {
  const root = await pinnedFixture(t);
  assert.deepEqual((await deploymentFiles(root)).errors, []);
  const { allow, headerSelectors } = JSON.parse(policy);
  assert.deepEqual(allow.map(entry => entry.path).sort(), ['public', 'dist'].flatMap(prefix => ['server', 'client'].map(name => `${prefix}/.well-known/matrix/${name}`)).sort());
  assert.deepEqual(headerSelectors, [{ paths: ['public/_headers', 'dist/_headers'], line: '/.well-known/matrix/*' }]);
  for (const entry of allow) {
    const original = metadata[entry.path.split('/').at(-1)];
    for (const changed of [original + '\n', '{}', original.replace('swarma.si', 'example.org')]) {
      await put(root, entry.path, changed);
      assert.deepEqual((await deploymentFiles(root)).errors, [`${entry.path}: deployment-machine-file`]);
    }
    await put(root, entry.path, original);
    assert.deepEqual((await deploymentFiles(root)).errors, []);
  }
  const { rm } = await import('node:fs/promises');
  await rm(join(root, allow[0].path));
  assert.deepEqual((await deploymentFiles(root)).errors, [`${allow[0].path}: deployment-machine-file`]);
});

// Header rules combine only on matching paths; the protocol selector does not grant wildcard CORS to pages.
test('deployment header scope and provider line limits', () => {
  const rules = parseHeaders(headers);
  for (const path of ['/', '/ru/', '/404.html']) {
    const actual = headersFor(rules, path);
    assert.equal(actual['x-content-type-options'], 'nosniff');
    assert.equal(actual['cross-origin-opener-policy'], 'same-origin');
    assert.equal(actual['access-control-allow-origin'], undefined);
    assert.equal(actual['strict-transport-security'], undefined);
  }
  for (const path of ['/.well-known/matrix/server', '/.well-known/matrix/client']) {
    const actual = headersFor(rules, path);
    assert.equal(actual['content-type'], 'application/json');
    assert.equal(actual['access-control-allow-origin'], '*');
    assert.ok(actual['content-security-policy']);
  }
  for (const source of ['/*\n  broken', '/*/*\n  X-Test: value', '  X-Test: value', '/*\n  X-Test: ' + 'x'.repeat(2000)]) {
    assert.throws(() => parseHeaders(source), error => error.rule === 'deployment-headers');
  }
});

// A real HTTP response permits same-origin CSS/JS, blocks inline JS with the intended CSP directive, and disables all exposed permissions.
test('deployment Chromium CSP positive and inline-script negative controls', async t => {
  const root = await fixture(t, {
    'index.html': html('<h1>Swarma</h1><script src="/allowed.js"></script>'),
    'bad.html': html('<script>window.inlineExecuted = true</script>'),
    '404.html': html('<h1>Страница не найдена</h1><p lang="en">Page not found</p>'),
    'site.css': 'body { font-family: sans-serif; }',
    'allowed.js': 'window.externalExecuted = true;',
  });
  const server = await staticServer(root, parseHeaders(headers));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
    const page = await preparePage(await browser.newContext());
    let observed = await inspectPage(page, server.origin + '/');
    assert.equal(observed.status, 200);
    assert.deepEqual(observed.violations, []);
    assert.deepEqual(observed.consoleViolations, []);
    assert.deepEqual(observed.failedRequests, []);
    assert.deepEqual(observed.allowedFeatures, []);
    assert.ok(observed.features.length > 0);
    assert.equal(observed.stylesheets, 1);
    assert.equal(await page.evaluate(() => window.externalExecuted), true);
    observed = await inspectPage(page, server.origin + '/bad.html');
    assert.ok(observed.violations.includes('script-src-elem'), JSON.stringify(observed.violations));
    assert.ok(observed.consoleViolations.length > 0);
    assert.equal(await page.evaluate(() => window.inlineExecuted), undefined);
    observed = await inspectPage(page, server.origin + '/missing');
    assert.equal(observed.status, 404);
    assert.ok(observed.text.includes('Страница не найдена') && observed.text.includes('Page not found'));
    assert.deepEqual(observed.violations, []);
    assert.equal((await fetch(server.origin + '/_headers')).status, 404);
  } finally { try { await browser?.close(); } finally { await server.close(); } }
});

// The production gate accepts clean headers/builds and rejects a weakened policy even when that policy emits no CSP violation.
test('deployment gate rejects unsafe policy instead of treating a quiet console as proof', async t => {
  const root = await pinnedFixture(t);
  for (const prefix of ['public', 'dist']) await put(root, `${prefix}/_headers`, headers);
  await put(root, 'dist/index.html', html('<h1>Swarma</h1>'));
  await put(root, 'dist/404.html', html('<h1>Страница не найдена</h1><p lang="en">Page not found</p>'));
  await put(root, 'dist/site.css', 'body { font-family: sans-serif; }');
  assert.deepEqual(await check(root), []);
  const inlinePlant = html('<h1>Swarma</h1><script>window.inlineExecuted = true</script>');
  await put(root, 'dist/index.html', inlinePlant);
  assert.ok((await check(root)).includes('dist/index.html: deployment-csp'));
  assert.equal(await readFile(join(root, 'dist/index.html'), 'utf8'), inlinePlant);
  await put(root, 'dist/index.html', html('<h1>Swarma</h1>'));
  const weakened = headers.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");
  for (const prefix of ['public', 'dist']) await put(root, `${prefix}/_headers`, weakened);
  const errors = await check(root);
  assert.ok(errors.includes('dist/index.html: deployment-headers'), errors.join('\n'));
  assert.ok(!errors.some(error => error.endsWith('deployment-csp')));
});

// A wildcard, page path, duplicate entry or malformed digest cannot widen the machine-file pin list.
test('deployment pin configuration rejects broad or malformed entries', async t => {
  const root = await pinnedFixture(t);
  assert.deepEqual((await deploymentFiles(root)).errors, []);
  for (const change of [value => { value.allow[0].path = 'public/*'; },
    value => { value.allow[0].path = 'dist/index.html'; },
    value => { value.allow[0] = value.allow[1]; },
    value => { value.allow[0].sha256 = 'unverified'; }]) {
    const value = JSON.parse(policy); change(value);
    await put(root, 'config/deployment-files.json', JSON.stringify(value));
    await assert.rejects(deploymentFiles(root), error => error.rule === 'deployment-headers');
  }
});
