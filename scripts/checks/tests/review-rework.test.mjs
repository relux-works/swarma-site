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
    ['direct Astro', [process.execPath, [join(root, 'scripts/run.mjs'), process.execPath, join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root]]],
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
console.log(diagnostic('zz-policy.value').message);
process.stdout.write('Safe: '); process.stdout.write('ZZ-POLICY.'); process.stdout.write('VALUE\\n');
process.stderr.write('zz-policy.'); process.stderr.write('value');
const bytes = Buffer.from('Пример\\n'); process.stdout.write(bytes.subarray(0, 1)); process.stdout.write(bytes.subarray(1));`;
  let result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, encoding: 'utf8',
    env: { ...process.env, IDENT_DENY_TOKENS: 'zz-policy,zz-policy.value' } });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stdout, '[redacted]\nSafe: [redacted]\nПример\n');
  assert.equal(result.stderr, '[redacted]');
  // Node's default fatal formatter bypasses write hooks and can expose source frames; installed boundaries fail safely.
  for (const statement of ["throw new Error('zz-policy.value')", "throw 'zz-policy.value'",
                           "Promise.reject(new Error('zz-policy.value'))", "Promise.reject('zz-policy.value')"]) {
    const fatal = `import { installDiagnostics } from ${JSON.stringify(moduleURL)}; installDiagnostics(); ${statement};`;
    const failed = spawnSync(process.execPath, ['--input-type=module', '-e', fatal], { cwd: root, encoding: 'utf8',
      env: { ...process.env, IDENT_DENY_TOKENS: 'zz-policy.value' } });
    assert.equal(failed.status, 1);
    assert.equal(failed.stdout, '');
    assert.equal(failed.stderr, 'build-diagnostic: unexpected failure\n');
  }
  await put(root, 'home/.config/swarma-site/deny-tokens.txt/placeholder', 'Public');
  result = spawnSync(process.execPath, ['--input-type=module', '-e', source], { cwd: root, encoding: 'utf8',
    env: { ...process.env, IDENT_DENY_TOKENS: '', CI: '', HOME: join(root, 'home') } });
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

// The supervisor covers framework loading before config code executes, including dependency and config syntax failures.
test('build: early configuration failures are supervised for both entrypoints', async t => {
  const root = await sourceFixture(t);
  const token = 'zz-bootstrap-canary';
  const config = await readFile(join(root, 'astro.config.mjs'), 'utf8');
  const module = `src/lib/${token}.mjs`;
  const env = { ...process.env, IDENT_DENY_TOKENS: token, SWARMA_BOOK_FIGURES: '0' };
  const entries = [
    [process.execPath, ['scripts/run.mjs', process.execPath, 'node_modules/astro/bin/astro.mjs', 'build']],
    ['npm', ['run', 'build']],
  ];
  const observations = [];
  for (const [command, args] of entries) {
    for (const kind of ['valid', 'missing-import', 'dependency-parse', 'config-parse']) {
      await put(root, module, kind === 'dependency-parse' ? 'export const value = ;' : 'export const value = 1;');
      const importPath = kind === 'missing-import' ? `./src/lib/missing-${token}.mjs` : `./${module}`;
      await put(root, 'astro.config.mjs', `import '${importPath}';\n` + config + (kind === 'config-parse' ? `\nconst value = "${token}" ; const broken = ;` : ''));
      const result = spawnSync(command, args, { cwd: root, env, encoding: 'utf8', timeout: 60000 });
      assert.ifError(result.error);
      const output = result.stdout + result.stderr;
      assert.equal(result.status, kind === 'valid' ? 0 : 1, output);
      assert.equal(output.toLowerCase().includes(token), false, 'early output contains configured token');
      if (kind !== 'valid') {
        assert.match(output, /\[redacted\]/);
        assert.match(output, /failed|error|ERROR/i);
      }
      observations.push({ command, kind, exit: result.status, redacted: !output.toLowerCase().includes(token) });
    }
  }
  await put(repository, '.temp/bootstrap-evidence.json', JSON.stringify(observations, null, 2));
});

// Parent pipes retain exit codes, UTF-8, literal redaction and unterminated tails; supervisor failures emit only safe text.
test('supervisor: streams, child exit and broken policy module fail safely', async t => {
  const root = await fixture(t);
  const wrapper = join(repository, 'scripts/run.mjs');
  const token = 'zz-cli-canary';
  const env = { ...process.env, IDENT_DENY_TOKENS: token };
  const source = "process.stdout.write('safe Пример\\nZZ-CLI-'); process.stdout.write('CANARY'); process.stderr.write('zz-cli-canary\\n'); process.exitCode=42;";
  let result = spawnSync(process.execPath, [wrapper, process.execPath, '-e', source], { cwd: root, env, encoding: 'utf8' });
  assert.equal(result.status, 42);
  assert.equal(result.stdout, 'safe Пример\n[redacted]');
  assert.equal(result.stderr, '[redacted]\n');
  await put(root, 'scripts/run.mjs', await readFile(wrapper));
  await put(root, 'scripts/checks/publication/policy.mjs', `export const ${token.replaceAll('-', '_')} = ;`);
  result = spawnSync(process.execPath, ['scripts/run.mjs', process.execPath, '-e', `console.log('${token}')`], { cwd: root, env, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'diagnostic-boundary: command unavailable\n');
  // The documented Python entrypoint enters the supervisor before argparse can format a user argument.
  result = spawnSync('python3', ['-B', 'scripts/check_contrast.py', 'src/styles/tokens.css', token], { cwd: repository, env, encoding: 'utf8', timeout: 60000 });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unrecognized arguments: \[redacted\]/);
  assert.equal((result.stdout + result.stderr).includes(token), false);
  // Even a syntax error in the Python implementation is compiled inside the child boundary.
  for (const name of ['check_contrast.py', 'check_computed_contrast.py']) {
    await put(root, `scripts/${name}`, await readFile(join(repository, `scripts/${name}`)));
  }
  for (const name of ['policy', 'normalization']) await put(root, `scripts/checks/publication/${name}.mjs`, await readFile(join(repository, `scripts/checks/publication/${name}.mjs`)));
  for (const [launcher, implementation] of [['check_contrast.py', 'contrast_contract.py'], ['check_computed_contrast.py', 'computed_contrast.py']]) {
    await put(root, `scripts/${implementation}`, `print('${token}') ; invalid =`);
    result = spawnSync('python3', ['-B', `scripts/${launcher}`], { cwd: root, env, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /SyntaxError/);
    assert.match(result.stderr, /\[redacted\]/);
    assert.equal((result.stdout + result.stderr).includes(token), false);
  }
});

// Browser stylesheet applicability survives unchanged HTML: print-only repairs cannot mask a broken screen palette.
test('contrast: link and style media preserve the screen cascade and local imports', async t => {
  const root = await fixture(t);
  const tokens = await readFile(join(repository, 'src/styles/tokens.css'), 'utf8');
  const broken = '\n@media (forced-colors:none) { :root { --color-role-human-text:var(--color-role-human-fill); } }';
  const link = '<link rel="stylesheet" href="/styles/main.css">';
  await put(root, 'dist/styles/tokens.css', tokens);
  await put(root, 'dist/styles/main.css', '@import url("./tokens.css");');
  await put(root, 'dist/index.html', `<!doctype html><html><head>${link}</head><body>Control</body></html>`);
  await contrast(root);
  // An intentionally broken print sheet must have no effect on a passing screen document.
  await put(root, 'dist/print.css', tokens + broken);
  await put(root, 'dist/index.html', `<!doctype html><html><head>${link}<link rel="stylesheet" href="/print.css" media="print"></head><body>Control</body></html>`);
  await contrast(root);
  await put(root, 'dist/styles/main.css', '@import url("./tokens.css");' + broken);
  await put(root, 'dist/print.css', tokens);
  await assert.rejects(() => contrast(root), /FAIL light role-human-text on role-human-fill 1\.00/);
  await put(root, 'dist/index.html', `<!doctype html><html><head>${link}<style media="print">${tokens}</style></head><body>Control</body></html>`);
  await assert.rejects(() => contrast(root), /FAIL light role-human-text on role-human-fill 1\.00/);
});

// An outer supervisor redacts npm's own headers/bootstrap errors and direct child arguments while preserving exit codes.
test('supervisor: npm bootstrap and echoed arguments remain inside the outer boundary', async t => {
  const root = await fixture(t);
  for (const path of ['scripts/run.mjs', 'scripts/checks/publication/policy.mjs', 'scripts/checks/publication/normalization.mjs']) await put(root, path, await readFile(join(repository, path)));
  const token = 'zz-npm-canary';
  const env = { ...process.env, IDENT_DENY_TOKENS: token, npm_config_cache: join(root, 'node_modules/.cache/npm') };
  const manifest = { name: 'boundary-probe', private: true,
    scripts: { check: 'node scripts/run.mjs node scripts/probe.mjs' }, description: token };
  await put(root, 'package.json', JSON.stringify(manifest));
  await put(root, 'scripts/probe.mjs', 'console.log("safe result"); console.log(JSON.stringify(process.argv.slice(2)));');
  const invoke = args => {
    const result = spawnSync(process.execPath, ['scripts/run.mjs', ...args], { cwd: root, env, encoding: 'utf8', timeout: 60000 });
    assert.ifError(result.error);
    assert.equal((result.stdout + result.stderr).toLowerCase().includes(token), false);
    return result;
  };
  let result = invoke(['npm', 'run', 'check']);
  assert.equal(result.status, 0, result.stdout + result.stderr); assert.match(result.stdout, /safe result/);
  for (const args of [['node', 'scripts/probe.mjs', token], ['npm', 'run', 'check', '--', token]]) {
    result = invoke(args);
    assert.equal(result.status, 0, result.stdout + result.stderr); assert.match(result.stdout, /\[redacted\]/);
  }
  // Forwarding is an argv operation: shell syntax remains ordinary data and causes no file write.
  result = invoke(['npm', 'run', 'check', '--', `${token}; node -e "require('fs').writeFileSync('escaped','bad')"`]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  await assert.rejects(readFile(join(root, 'escaped')), { code: 'ENOENT' });
  await put(root, 'package.json', JSON.stringify(manifest).replace(/}$/, ',}'));
  result = invoke(['npm', 'run', 'check']);
  assert.equal(result.status, 1); assert.match(result.stderr, /EJSONPARSE/); assert.match(result.stderr, /\[redacted\]/);
});

// Leaf npm options reach the real Astro/checker; compound --shell tasks reject extras without interpreting them.
test('supervisor: npm help and contrast control reach their intended commands', async t => {
  const root = await sourceFixture(t);
  const env = { ...process.env, SWARMA_BOOK_FIGURES: '0' };
  const invoke = args => spawnSync(process.execPath, ['scripts/run.mjs', 'npm', 'run', ...args], { cwd: root, env, encoding: 'utf8', timeout: 90000 });
  let result = invoke(['build']); assert.ifError(result.error); assert.equal(result.status, 0, result.stdout + result.stderr);
  result = invoke(['build', '--', '--help']); assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr); assert.match(result.stdout, /--help/);
  result = invoke(['check:contrast', '--', '--control']); assert.ifError(result.error);
  assert.equal(result.status, 1); assert.match(result.stdout + result.stderr, /FAIL light text-faint/);
  assert.doesNotMatch(result.stdout + result.stderr, /diagnostic-boundary: command unavailable/);
  result = invoke(['check', '--', '--help']); assert.ifError(result.error);
  assert.equal(result.status, 1); assert.match(result.stderr, /diagnostic-boundary: command unavailable/);
});

// Full npm builds reject ordinary HTML class/attribute spellings for the same status-forbidden rule; clean output survives rejection.
test('no-status: actual builds reject unquoted, spaced and multiple class tokens', async t => {
  const root = await sourceFixture(t);
  const env = { ...process.env, SWARMA_BOOK_FIGURES: '0' };
  const build = () => spawnSync(process.execPath, ['scripts/run.mjs', 'npm', 'run', 'build'], { cwd: root, env, encoding: 'utf8', timeout: 90000 });
  let result = build(); assert.ifError(result.error); assert.equal(result.status, 0, result.stdout + result.stderr);
  const clean = (await readFile(join(root, 'dist/ru/platform/index.html'), 'utf8')).replace('</main>', '<span class="ordinary-note">Текст</span></main>');
  await put(root, 'public/legacy.html', clean);
  result = build(); assert.ifError(result.error); assert.equal(result.status, 0, result.stdout + result.stderr);
  const previous = await readFile(join(root, 'dist/legacy.html'));
  for (const attribute of ['class=status-chip', 'class = "status-chip"', 'class="note status-chip other"', 'class\n=\n"status-table"', 'data-status-row = "part"']) {
    await put(root, 'public/legacy.html', clean.replace('class="ordinary-note"', attribute));
    result = build(); assert.ifError(result.error);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /public\/legacy\.html: status-forbidden/);
    assert.deepEqual(await readFile(join(root, 'dist/legacy.html')), previous);
  }
  await put(root, 'public/legacy.html', clean);
  result = build(); assert.ifError(result.error); assert.equal(result.status, 0, result.stdout + result.stderr);
});
