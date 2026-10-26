import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, put, run } from './fixture.mjs';

// Ordinary bilingual prose and web syntax pass; these controls do not prove arbitrary code is free of false positives.
test('identifiers clean web fixture', async t => {
  const root = await fixture(t, { 'src/sample.txt': 'Swarma. Страница готовится. English text. @media screen { a { color: inherit !important; } } const cost = `$${value}`;', 'dist/index.html': '<p>Текст и English</p>' });
  run('identifiers', root);
});

const plants = [
  ['matrix-user', '@reader:example.org'],
  ['matrix-event', '$abcdefghijklmnopqrstuv'],
  ['matrix-room', '!abcdefghijklmnopqrstuv:example.org'],
  ...['TASK', 'STORY', 'BUG', 'EPIC'].map(kind => ['board-id', `${kind}-000000-aaaaaa`]),
  ...['sample-dev1', 'sample-rev2', 'sample_dev1', 'sample_rev', 'sample_orch', 'sample_orch12'].map(value => ['workplace-name', value]),
  ...['/Users/reader/file', '/home/reader/file', '~/file', 'C:\\Users\\reader'].map(value => ['local-path', value]),
  ...['https://claude.ai/code/session_example', 'https://chatgpt.com/codex/example'].map(value => ['session-link', value]),
  ['private-repository', 'https://github.com/relux-works/private-example'],
  ['email', 'reader@example.org'],
];
// Each forbidden identifier category fails through the real CLI with its own named rule.
for (const [index, [rule, value]] of plants.entries()) test(`identifiers plant ${index}: ${rule}`, async t => {
  const root = await fixture(t, { 'src/sample.txt': value });
  run('identifiers', root, rule);
});

// Every publication scan root is covered, including built attributes and HTML entity encoding.
for (const path of ['src/sample.txt', 'public/sample.txt', 'docs/sample.md', 'README.md', 'dist/index.html', 'scripts/example.mjs']) test(`identifiers scans ${path}`, async t => {
  const root = await fixture(t);
  // A raw address in an attribute must be found even if it is not visible page text.
  await put(root, path, '<a href="mailto:reader@example.org">Text</a>');
  run('identifiers', root, 'email');
});

// Literal policy patterns and planted controls are exempt only at their documented exact locations.
test('identifiers policy exclusions stay narrow', async t => {
  const root = await fixture(t, { 'scripts/checks/identifier-rules.mjs': 'reader@example.org', 'scripts/checks/tests/example.mjs': 'reader@example.org' });
  run('identifiers', root);
  await put(root, 'src/tests/example.mjs', 'reader@example.org');
  run('identifiers', root, 'email');
});

// Entity-encoded visible identifiers are decoded before checking.
test('identifiers decoded text', async t => {
  const root = await fixture(t, { 'dist/index.html': '<p>reader&#64;example.org</p>' });
  run('identifiers', root, 'email');
});

// Exact allowlist entries pass; a similar repository and a different email remain forbidden.
test('identifiers exact allowlist', async t => {
  const root = await fixture(t, { 'config/public-repos.json': '{"repositories":["public-example"],"emails":["public@example.org"]}', 'README.md': 'https://github.com/relux-works/public-example.git public@example.org' });
  run('identifiers', root);
  await put(root, 'README.md', 'https://github.com/relux-works/public-example-extra other@example.org');
  run('identifiers', root, 'private-repository');
  run('identifiers', root, 'email');
});

// Every decoded publication attribute is checked, including encoded links, metadata and accessible names.
for (const [index, [html, rule]] of [
  ['<a href="https://github.com/relux-works/&#112;rivate-example">Source</a>', 'private-repository'],
  ['<a href="mailto:reader&#64;example.org">Contact</a>', 'email'],
  ['<img alt="reader&#64;example.org" src="/image.png">', 'email'],
  ['<img src="/&#85;sers/reader/image.png" alt="Image">', 'local-path'],
  ['<img srcset="/&#85;sers/reader/image.png 1x, /image.png 2x" alt="Image">', 'local-path'],
  ['<meta name="description" content="reader&#64;example.org">', 'email'],
  ['<a href="/" title="reader&#64;example.org">Contact</a>', 'email'],
  ['<a href="/" aria-label="reader&#64;example.org">Contact</a>', 'email'],
  ['<a href="/" aria-description="&#64;reader:example.org">Contact</a>', 'matrix-user'],
].entries()) test(`identifiers decoded attribute plant ${index}: ${rule}`, async t => {
  const root = await fixture(t, { 'public/probe.html': html, 'dist/probe.html': html });
  run('identifiers', root, rule);
});

// Entity decoding preserves valid public values and exact allowlist behavior.
test('identifiers decoded attributes positive control', async t => {
  const root = await fixture(t, {
    'config/public-repos.json': '{"repositories":["public-example"],"emails":["public@example.org"]}',
    'dist/index.html': '<a href="https://github.com/relux-works/&#112;ublic-example" title="Swarma">Source</a><img src="/image.png" srcset="/image.png 1x, /large.png 2x" alt="Swarma"><meta name="description" content="Страница готовится."><a href="mailto:public&#64;example.org" aria-label="Contact" aria-description="Public contact">Contact</a>',
  });
  run('identifiers', root);
});

// The same synthetic plant fails only when configured; matching is literal and case-insensitive.
test('identifiers external tokens', async t => {
  const root = await fixture(t, { 'src/sample.txt': 'ZZ-HOST-ALPHA and zz.host+alpha' });
  run('identifiers', root, 'deny-token');
  run('identifiers', root, undefined, { IDENT_DENY_TOKENS: 'zz-host-beta' });
  run('identifiers', root, 'deny-token', { IDENT_DENY_TOKENS: ' , zz.host+alpha, ' });
  await put(root, 'src/sample.txt', 'zzXhosttalpha');
  run('identifiers', root, undefined, { IDENT_DENY_TOKENS: 'zz.host+alpha' });
});

// External tokens also cover policy/test sources, configuration, hidden CI files and decoded output.
for (const path of ['scripts/checks/identifier-rules.mjs', 'scripts/checks/tests/probe.mjs', 'config/probe.json', '.github/probe.yml', 'dist/index.html', 'LICENSE']) test(`identifiers external scope ${path}`, async t => {
  const root = await fixture(t, { [path]: path.endsWith('.json') ? JSON.stringify({ label: 'zz-host-alpha' }) : '<p>zz-host-&#97;lpha</p>' });
  run('identifiers', root, 'deny-token');
});

// Filenames are covered without echoing the configured token in a diagnostic.
test('identifiers external filename redaction', async t => {
  const root = await fixture(t, { 'public/zz-host-alpha.txt': 'Ordinary text' });
  const result = run('identifiers', root, 'deny-token');
  assert.ok(!result.stderr.toLowerCase().includes('zz-host-alpha'));
});

// File fallback works in CI; a nonempty environment list takes precedence over that file.
test('identifiers external file fallback', async t => {
  const home = await fixture(t, {
    '.config/swarma-site/deny-tokens.txt': 'zz-host-alpha\nzz-host-beta\n',
  });
  const root = await fixture(t, { 'src/sample.txt': 'zz-host-alpha' });
  run('identifiers', root, 'deny-token', { HOME: home, IDENT_DENY_TOKENS: '', CI: 'true' });
  run('identifiers', root, undefined, { HOME: home, IDENT_DENY_TOKENS: 'zz-host-gamma', CI: 'true' });
  await put(root, 'src/sample.txt', 'Ordinary text');
  run('identifiers', root, undefined, { HOME: home, IDENT_DENY_TOKENS: '', CI: 'true' });
});

// CI cannot opt out of the missing-source failure; empty input is not a valid source.
for (const optional of ['', '1']) test(`identifiers missing tokens in CI optional=${optional || 'unset'}`, async t => {
  const root = await fixture(t);
  run('identifiers', root, 'identifier-deny-tokens', { IDENT_DENY_TOKENS: ' , ', CI: 'true', IDENT_DENY_TOKENS_OPTIONAL: optional });
});

// Local absence warns and fails by default; the explicit opt-out still runs generic rules.
test('identifiers local optional tokens', async t => {
  const root = await fixture(t);
  const env = { IDENT_DENY_TOKENS: '', CI: '' };
  const missing = run('identifiers', root, 'identifier-deny-tokens', env);
  assert.match(missing.stderr, /Warning: external deny tokens are missing/);
  const optional = run('identifiers', root, undefined, { ...env, IDENT_DENY_TOKENS_OPTIONAL: '1' });
  assert.match(optional.stderr, /Warning: external deny tokens are missing/);
  await put(root, 'src/sample.txt', '@reader:example.org');
  run('identifiers', root, 'matrix-user', { ...env, IDENT_DENY_TOKENS_OPTIONAL: '1' });
});

// Parsing and genuine file-read failures reject without exposing any configured value on either stream.
test('identifiers exception diagnostics are safe', async t => {
  const { chmod, readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const tokens = ['zz-host-alpha', 'zz-host-beta'];
  const environment = { IDENT_DENY_TOKENS: tokens.join(',') };
  const safe = result => {
    for (const token of tokens) assert.ok(!(result.stdout + result.stderr).toLowerCase().includes(token));
  };
  const root = await fixture(t);
  safe(run('identifiers', root, undefined, environment));
  await put(root, 'config/public-repos.json', tokens.join(' '));
  safe(run('identifiers', root, 'identifier-allowlist', environment));
  await put(root, 'config/public-repos.json', '{"repositories":[],"emails":[]}');
  const path = join(root, 'public/zz-host-alpha.txt');
  await put(root, 'public/zz-host-alpha.txt', 'Ordinary text');
  safe(run('identifiers', root, 'deny-token', environment));
  await chmod(path, 0);
  try {
    await assert.rejects(readFile(path), { code: 'EACCES' });
    safe(run('identifiers', root, 'identifier-scan', environment));
  } finally { await chmod(path, 0o600); }
  safe(run('identifiers', root, 'deny-token', environment));
});

// Malformed configurations reject by a fixed rule, independently of parser exception wording.
for (const value of ['{', 'null', '[]', '{"repositories":[1],"emails":[]}', '{"repositories":[],"emails":"all"}']) test(`identifiers invalid allowlist ${value}`, async t => {
  const root = await fixture(t, { 'config/public-repos.json': value });
  run('identifiers', root, 'identifier-allowlist');
});

const { encodedIdentifiers } = await import('./identifier-fixture.mjs');
// Every supported encoding rejects both an external literal and a generic identifier in source and output, beside valid controls.
for (const [name, suffix, external, generic, clean, genericRule = 'matrix-user'] of encodedIdentifiers) test(`identifiers publication decoding: ${name}`, async t => {
  const paths = [`src/probe.${suffix}`, `dist/probe.${suffix}`];
  const root = await fixture(t, Object.fromEntries(paths.map(path => [path, clean])));
  run('identifiers', root);
  for (const [value, rule] of [[external, 'deny-token'], [generic, genericRule]]) {
    for (const path of paths) {
      await put(root, path, value);
      const result = run('identifiers', root, rule);
      assert.ok(result.stderr.split('\n').includes(`${path}: ${rule}`), result.stderr);
      assert.ok(!(result.stdout + result.stderr).toLowerCase().includes('zz-host-alpha'));
      await put(root, path, clean);
    }
  }
  run('identifiers', root);
});

// Consumer decoding runs once; entity-looking JSON/CSS strings and double entities remain literal.
for (const [suffix, source] of [
  ['md', '&amp;#64;reader:example.org'],
  ['html', '<p>&amp;#64;reader:example.org</p>'],
  ['svg', '<svg xmlns="http://www.w3.org/2000/svg"><text>&amp;#64;reader:example.org</text></svg>'],
  ['json', '{"label":"&#64;reader:example.org"}'],
  ['css', String.raw`p {content:"\26 #64;reader:example.org"}`],
]) test(`identifiers decoding boundary ${suffix}`, async t => {
  const root = await fixture(t, { [`public/probe.${suffix}`]: source });
  run('identifiers', root);
});

// Malformed JSON/CSS and unsupported custom XML entities cannot silently skip the decoded scan.
for (const [suffix, source] of [['json', '{"label":'], ['css', 'p {content:"unfinished}'], ['css', '/* unfinished'],
  ['svg', '<!DOCTYPE svg [<!ENTITY private "zz-host-alpha">]><svg xmlns="http://www.w3.org/2000/svg"><text>&private;</text></svg>']]) test(`identifiers decode failure ${suffix}: ${source}`, async t => {
  const root = await fixture(t, { [`public/probe.${suffix}`]: source });
  run('identifiers', root, 'publication-decode');
});

// Even a throw before check() starts reaches the actual identifier CLI's fixed diagnostic instead of an exception message.
test('identifiers CLI boundary suppresses thrown values', async t => {
  const { spawnSync } = await import('node:child_process');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = await fixture(t, { 'preload.mjs': 'process.cwd = () => { throw new Error("zz-host-alpha"); };' });
  const script = fileURLToPath(new URL('../identifiers.mjs', import.meta.url));
  const result = spawnSync(process.execPath, ['--import', join(root, 'preload.mjs'), script], {
    cwd: root, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, HOME: root, IDENT_DENY_TOKENS: 'zz-host-alpha', CI: 'true' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(result.stderr.trim(), 'identifier-scan: cannot run identifier check');
  assert.ok(!(result.stdout + result.stderr).includes('zz-host-alpha'));
});
