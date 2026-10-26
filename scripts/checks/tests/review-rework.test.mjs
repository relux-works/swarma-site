import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { openBrowser } from '../publication/browser.mjs';
import { fixture, put, page } from './fixture.mjs';
import { check as contrast } from '../contrast.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));

// The browser must numerically reject the former forced pressed pair beside a passing shipped token set.
test('contrast: former forced pressed foreground fails numerically', async t => {
  const root = await fixture(t);
  for (const name of ['check_computed_contrast.py', 'check_contrast.py']) {
    await put(root, `scripts/${name}`, await readFile(join(repository, `scripts/${name}`)));
  }
  const tokens = await readFile(join(repository, 'src/styles/tokens.css'), 'utf8');
  await contrast(root, { cssOverride: tokens });
  const former = tokens + '\n@media (forced-colors: active) { :root { --color-control-text-pressed: ButtonText; } }';
  await assert.rejects(() => contrast(root, { cssOverride: former }), /FAIL light\/forced control-text-pressed on control-pressed [0-9.]+/);
});

async function sourceFixture(t) {
  const root = await fixture(t);
  // Convention builds need production scanner modules, not the suite's unrelated policy plants.
  for (const path of ['src', 'public', 'config', 'scripts', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(join(repository, path), join(root, path), { recursive: true, filter: path => path !== join(repository, 'scripts/checks/tests') });
  }
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  return root;
}

// Direct Astro and npm build failures retain the intended rule/location while redacting messages, paths and frames.
test('build: convention diagnostics never print configured policy values', async t => {
  const root = await sourceFixture(t);
  const token = 'zz-review-policy';
  const path = 'src/content/pages/ru/probe-' + token + '.md';
  const environment = { ...process.env, IDENT_DENY_TOKENS: token, SWARMA_BOOK_FIGURES: '0' };
  const entries = [
    ['direct Astro', [process.execPath, [join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root]]],
    ['npm build', ['npm', ['run', 'build']]],
  ];
  const cases = [
    ['unknown-figure', `[[figure ${token}]]`],
    ['malformed-reference', `Источник: глава ${token}`],
    ['malformed-marker', `[[publications ${token}]]`],
  ];
  for (const [entry, [command, args]] of entries) {
    await put(root, path, page('', 'Обычное описание.'));
    let result = spawnSync(command, args, { cwd: root, env: environment, encoding: 'utf8', timeout: 60000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const [rule, body] of cases) {
      await put(root, path, page('', body));
      result = spawnSync(command, args, { cwd: root, env: environment, encoding: 'utf8', timeout: 60000 });
      assert.ifError(result.error);
      const output = result.stdout + result.stderr;
      assert.equal(result.status, 1, output);
      assert.ok(output.includes(rule), entry + ': ' + output);
      assert.match(output, /probe-\[redacted\]\.md:\d+:/);
      assert.equal(output.toLowerCase().includes(token), false, entry + ': raw denied token escaped');
    }
  }
});

// Output boundaries redact case-insensitive literal tokens across writes and preserve harmless UTF-8 and final tails.
test('diagnostics: split streams, literal patterns and unreadable policy', async t => {
  const root = await fixture(t);
  const moduleURL = new URL('../../../src/lib/diagnostics.mjs', import.meta.url).href;
  const source = `import { installDiagnostics, diagnostic } from ${JSON.stringify(moduleURL)};
installDiagnostics(); installDiagnostics();
console.log(diagnostic('zz-policy.(value)').message);
process.stdout.write('Safe: '); process.stdout.write('ZZ-POLICY.'); process.stdout.write('(VALUE)\\n');
process.stderr.write('zz-policy.'); process.stderr.write('(value)');
const bytes = Buffer.from('Пример\\n'); process.stdout.write(bytes.subarray(0, 1)); process.stdout.write(bytes.subarray(1));`;
  let result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, encoding: 'utf8',
    env: { ...process.env, IDENT_DENY_TOKENS: 'zz-policy,zz-policy.(value)' } });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stdout, '[redacted]\nSafe: [redacted]\nПример\n');
  assert.equal(result.stderr, '[redacted]');
  // Node's default fatal formatter bypasses write hooks and can expose source frames; installed boundaries fail safely.
  for (const statement of ["throw new Error('zz-policy.(value)')", "throw 'zz-policy.(value)'",
                           "Promise.reject(new Error('zz-policy.(value)'))", "Promise.reject('zz-policy.(value)')"]) {
    const fatal = `import { installDiagnostics } from ${JSON.stringify(moduleURL)}; installDiagnostics(); ${statement};`;
    const failed = spawnSync(process.execPath, ['--input-type=module', '-e', fatal], { cwd: root, encoding: 'utf8',
      env: { ...process.env, IDENT_DENY_TOKENS: 'zz-policy.(value)' } });
    assert.equal(failed.status, 1);
    assert.equal(failed.stdout, '');
    assert.equal(failed.stderr, 'build-diagnostic: unexpected failure\n');
  }
  await put(root, 'home/.config/swarma-site/deny-tokens.txt/placeholder', 'Public');
  result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, encoding: 'utf8',
    env: { ...process.env, IDENT_DENY_TOKENS: '', HOME: join(root, 'home') } });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'diagnostic-policy: external policy is unreadable\n');
});

// Real button styles consume the new foreground for pointer and ARIA pressed states without changing the control box.
test('controls: default and pressed styles match their semantic pairs', async t => {
  const root = await fixture(t);
  const session = await openBrowser(root), browser = session.browser;
  try {
    const screen = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await screen.route('**/*', route => route.abort());
    await screen.setContent('<!doctype html><html><head></head><body><button type="button">Action</button></body></html>');
    for (const path of ['src/styles/tokens.css', 'src/styles/site.css']) await screen.addStyleTag({ content: await readFile(join(repository, path), 'utf8') });
    const session = await screen.context().newCDPSession(screen);
    const button = screen.locator('button');
    const colors = () => button.evaluate(node => {
      const style = getComputedStyle(node), probe = document.createElement('span');
      probe.style.forcedColorAdjust = 'none'; document.body.append(probe);
      const expected = token => { probe.style.color = `var(--color-${token})`; return getComputedStyle(probe).color; };
      const value = { color: style.color, background: style.backgroundColor, forcedColorAdjust: style.forcedColorAdjust,
        regular: expected('control-text'), pressed: expected('control-text-pressed'), pressedBackground: expected('control-pressed'),
        width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height };
      probe.remove(); return value;
    });
    for (const forced of ['none', 'active']) for (const scheme of ['light', 'dark']) for (const more of ['no-preference', 'more']) {
      await session.send('Emulation.setEmulatedMedia', { features: [
        { name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-contrast', value: more },
        { name: 'forced-colors', value: forced },
      ] });
      await screen.mouse.move(350, 800);
      const normal = await colors(); assert.equal(normal.color, normal.regular);
      assert.equal(normal.forcedColorAdjust, forced === 'active' ? 'none' : 'auto');
      await button.hover(); await screen.mouse.down();
      const active = await colors();
      assert.equal(active.color, active.pressed); assert.equal(active.background, active.pressedBackground);
      assert.equal(active.width, normal.width); assert.equal(active.height, normal.height);
      await screen.mouse.up();
      await button.evaluate(node => node.setAttribute('aria-pressed', 'true'));
      const toggled = await colors();
      assert.equal(toggled.color, toggled.pressed); assert.equal(toggled.background, toggled.pressedBackground);
      await button.evaluate(node => node.removeAttribute('aria-pressed'));
    }
  } finally { await session.close(); }
});
