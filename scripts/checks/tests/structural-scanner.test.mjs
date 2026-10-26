import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, put, run } from './fixture.mjs';

// Valid UTF-8 controls pass; BOM, invalid UTF-8 and NUL-encoded text fail before consumer decoding.
for (const suffix of ['html', 'svg', 'md', 'css', 'json', 'txt']) test(`structural encoding ${suffix}`, async t => {
  const clean = suffix === 'json' ? '{"label":"Swarma"}' : suffix === 'css' ? 'p {color: inherit}' : 'Swarma';
  const root = await fixture(t, { [`public/probe.${suffix}`]: clean });
  run('identifiers', root);
  for (const bytes of [Buffer.from('\ufeffSwarma'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('zz-host-&#97;lpha', 'utf16le')]), Buffer.from([0xc3, 0x28]), Buffer.from('S\0w\0')]) {
    for (const dir of ['public', 'dist']) {
      await put(root, `${dir}/probe.${suffix}`, bytes);
      const result = run('identifiers', root, 'publication-decode');
      assert.ok(!result.stderr.includes('zz-host-alpha'));
      assert.ok(result.stderr.split('\n').includes(`${dir}/probe.${suffix}: publication-decode`));
      await put(root, `${dir}/probe.${suffix}`, clean);
      run('identifiers', root);
    }
  }
});

// Actual CommonMark inline rendering joins emphasis and HTML; generic and literal rules both apply.
test('structural CommonMark visible values', async t => {
  const root = await fixture(t, { 'public/probe.md': 'Swarma **Runtime**' });
  run('identifiers', root);
  for (const [value, rule] of [['zz-host-**alpha**', 'deny-token'], ['@rea**der**:example.org', 'matrix-user'], ['[zz-host-**alpha**](https://example.org)', 'deny-token']]) {
    for (const dir of ['public', 'dist']) {
      await put(root, `${dir}/probe.md`, value);
      run('identifiers', root, rule);
      await put(root, `${dir}/probe.md`, 'Swarma');
    }
  }
});

// All CommonMark code forms retain literal entity notation; equivalent prose must decode and fail.
test('structural CommonMark code contexts', async t => {
  const root = await fixture(t);
  for (const source of ['    zz-host-&#97;lpha\n', '`zz-host-&#97;lpha`', '```text\nzz-host-&#97;lpha\n```', '>     zz-host-&#97;lpha\n', '- example\n\n      zz-host-&#97;lpha\n']) {
    await put(root, 'public/probe.md', source);
    run('identifiers', root);
  }
  await put(root, 'public/probe.md', 'zz-host-&#97;lpha');
  run('identifiers', root, 'deny-token');
});

// Rendered names and availability use the same browser/CommonMark path as identifiers.
test('structural rendered language policies', async t => {
  const root = await fixture(t, { 'src/content/pages/ru/probe.md': 'Swarma Runtime. Page in preparation.' });
  run('names', root);
  run('status-language', root);
  await put(root, 'src/content/pages/ru/probe.md', 'Co**lo**ny');
  run('names', root, 'canonical-name');
  await put(root, 'src/content/pages/ru/probe.md', 'available **now**');
  run('status-language', root, 'status-language');
});

// Chromium resolves labelledby and computed generated text, while ignoring ordinary CSS/script text for availability.
test('structural browser and generated content', async t => {
  const root = await fixture(t, { 'dist/index.html': '<p>Swarma</p><script>"available now"</script>' });
  run('status-language', root);
  await put(root, 'dist/index.html', '<style>p::before { content: "available " "now"; }</style><p>Swarma</p>');
  run('status-language', root, 'status-language');
  await put(root, 'dist/index.html', '<span id="a">zz-host-</span><span id="b">alpha</span><button aria-labelledby="a b">Details</button>');
  run('identifiers', root, 'deny-token');
});

// Every scanner CLI redacts findings and fixed errors; unreadable paths cannot become tracebacks.
test('structural shared diagnostic redaction', async t => {
  const { chmod, readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const root = await fixture(t, { 'dist/zz-host-alpha.html': '<p>Swarm Runtime available now</p>' });
  for (const [check, rule] of [['names', 'canonical-name'], ['status-language', 'status-language']]) {
    const result = run(check, root, rule);
    assert.ok(!(result.stdout + result.stderr).includes('zz-host-alpha'));
  }
  await put(root, 'public/zz-host-alpha.html', '<input>');
  let result = run('publication-surface', root, 'publication-input');
  assert.ok(!result.stderr.includes('zz-host-alpha'));
  const path = join(root, 'public/zz-host-alpha.html');
  await chmod(path, 0);
  try {
    await assert.rejects(readFile(path), { code: 'EACCES' });
    result = run('publication-surface', root, 'publication-scan');
    assert.ok(!result.stderr.includes('zz-host-alpha'));
  } finally { await chmod(path, 0o600); }
});

// An ignored at-keyword is rejected as invalid publication syntax; no CSS parser computes contrast here.
test('structural CSS library rejects ignored repair syntax', async t => {
  const root = await fixture(t, { 'public/probe.css': '@media (min-width: 1px) { p {color: inherit} }' });
  run('identifiers', root);
  await put(root, 'public/probe.css', '@/**/media (min-width: 1px) { p {color: white} }');
  run('identifiers', root, 'publication-decode');
  await put(root, 'public/probe.css', 'p {content:"zz-host-"/**/"alpha"}');
  run('identifiers', root, 'deny-token');
});

// A CommonMark code example creates no publication element; ordinary author HTML still fails.
test('structural publication code is not phantom markup', async t => {
  const root = await fixture(t);
  for (const source of ['    <input>\n', '`<input>`', '```html\n<input>\n```', '>     <input>\n']) {
    await put(root, 'public/probe.md', source);
    run('publication-surface', root);
  }
  await put(root, 'public/probe.md', '<input>');
  run('publication-surface', root, 'publication-input');
});

// Percent notation is literal in a title/code example; a URL consumer decodes it exactly once.
test('structural percent decoding follows URL consumers', async t => {
  const root = await fixture(t, { 'dist/index.html': '<p title="zz-host-%61lpha">Swarma</p>' });
  run('identifiers', root);
  await put(root, 'dist/index.html', '<a href="zz-host-%61lpha">Swarma</a>');
  run('identifiers', root, 'deny-token');
});

// Actual relative stylesheet loading contributes generated text; external assets cannot supply a repair.
test('structural browser loads unchanged local CSS', async t => {
  const root = await fixture(t, {
    'dist/nested/index.html': '<link rel="stylesheet" href="./theme.css"><p>Swarma</p>',
    'dist/nested/theme.css': 'p::before {content:"available " "now"}',
  });
  run('status-language', root, 'status-language');
  await put(root, 'dist/nested/theme.css', 'p::before {content:"In preparation"}');
  run('status-language', root);
});

// A real cached browser remains usable after HOME isolates policy files; an empty child cache rejects.
test('structural installed browser survives policy HOME isolation', async t => {
  const { chromium } = await import('playwright');
  const { spawnSync } = await import('node:child_process');
  const { mkdir, writeFile, access, readdir } = await import('node:fs/promises');
  const { dirname, join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const repository = fileURLToPath(new URL('../../..', import.meta.url));
  const home = await fixture(t);
  const root = await fixture(t, { 'dist/index.html': '<p>Swarma</p>' });
  const actual = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath();
  await access(actual);
  const env = { ...process.env, HOME: home, PROBE_ROOT: root };
  delete env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  delete env.PLAYWRIGHT_BROWSERS_PATH;
  delete env.XDG_CACHE_HOME;
  const options = { cwd: repository, env, encoding: 'utf8', timeout: 30000 };
  const lookup = spawnSync(process.execPath, ['--input-type=module', '-e', 'import {chromium} from "playwright"; console.log(chromium.executablePath())'], options);
  assert.ifError(lookup.error);
  assert.equal(lookup.status, 0, lookup.stderr);
  const cached = lookup.stdout.trim();
  assert.ok(cached.startsWith(home + '/'), 'The cache must remain inside the isolated fixture');
  await mkdir(dirname(cached), { recursive: true });
  // This launcher delegates to the actual installed engine; no browser output or scanner verdict is mocked.
  await writeFile(cached, "#!/bin/sh\nexec '" + actual.replaceAll("'", "'\\''") + "' \"$@\"\n", { mode: 0o700 });
  const helper = new URL('./fixture.mjs', import.meta.url).href;
  const positive = spawnSync(process.execPath, ['--input-type=module', '-e', `import {run} from ${JSON.stringify(helper)}; run('identifiers', process.env.PROBE_ROOT);`], options);
  assert.ifError(positive.error);
  assert.equal(positive.status, 0, positive.stdout + positive.stderr);
  const cli = fileURLToPath(new URL('../identifiers.mjs', import.meta.url));
  await put(root, 'dist/neighbor.html', '<p>Swarma</p>');
  const negative = spawnSync(process.execPath, [cli], { ...options, cwd: root, env: { ...env, HOME: root, IDENT_DENY_TOKENS: 'zz-host-alpha' } });
  assert.ifError(negative.error);
  assert.equal(negative.status, 1, negative.stdout + negative.stderr);
  assert.match(negative.stderr, /publication-decode/u);
  await assert.rejects(access(join(root, cached.slice(home.length))), { code: 'ENOENT' });
  assert.deepEqual(await readdir(join(root, '.temp/publication-browser')), [], 'Repeated startup errors must leave no browser scratch');
});
