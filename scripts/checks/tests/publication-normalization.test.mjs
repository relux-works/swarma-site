import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, put, run } from './fixture.mjs';
import { includesToken, normalizeText } from '../publication/normalization.mjs';
import { redactor } from '../publication/policy.mjs';

// Comparison and redaction agree on Unicode separators, case and overlapping literals without changing Unicode words.
test('normalization: comparison and redaction controls', () => {
  assert.equal(normalizeText('  Swarma\u202fRuntime\u200d\u00ad\nдокументация  '), 'Swarma Runtime документация');
  assert.equal(includesToken('zz\u202freviewer\u200d\tOMEGA', 'ZZ reviewer omega'), true);
  assert.equal(includesToken('Swarma Runtime', 'zz reviewer omega'), false);
  assert.equal(includesToken('Swarma Runtime', '\u200d '), false);
  assert.equal(redactor(['zz reviewer', 'reviewer omega'])('before zz\u202freviewer\u200d\tOMEGA after'), 'before [redacted] after');
  assert.equal(redactor(['платформа'])('ПЛАТ\u00adФОРМА'), 'ПЛАТ\u00adФОРМА');
  assert.equal(includesToken('before Ο Σ after', 'ΟΣ'), true);
  assert.equal(includesToken('ος', 'ΟΣ'), false);
  assert.equal(redactor(['ΟΣ'])('before Ο Σ after'), 'before [redacted] after');
  assert.equal(redactor(['zz reviewer omega'])('Swarma Runtime'), 'Swarma Runtime');
});

// Invisible formatting characters cannot split an external literal; ordinary Unicode stays publishable.
test('normalization: invisible identifier separators', async t => {
  const root = await fixture(t, { 'public/probe.md': 'Swarma Runtime — документация.' });
  run('identifiers', root);
  for (const separator of ['\u00ad', '\u180e', '\u200b', '\u200c', '\u200d', '\u2060', '\ufeff']) {
    await put(root, 'public/probe.md', `zz-host-al${separator}pha`);
    run('identifiers', root, 'deny-token');
  }
  await put(root, 'public/probe.md', '`zz-host-al&#x200d;pha`');
  run('identifiers', root);
  await put(root, 'public/probe.md', 'zz-host-al&#x200d;pha');
  run('identifiers', root, 'deny-token');
});

// The actual browser's line breaks and Unicode spaces match the same external multiword literal.
test('normalization: rendered line breaks and separator-free literals', async t => {
  const root = await fixture(t);
  const env = { IDENT_DENY_TOKENS: 'zzrevieweromega' };
  await put(root, 'dist/index.html', '<p>Swarma Runtime — документация.</p>');
  run('identifiers', root, undefined, env);
  for (const html of ['<p>zz reviewer<br>omega</p>', '<div>zz reviewer</div><div>omega</div>', '<p>zz\u202freviewer\u3000omega</p>', '<p>zzrevieweromega</p>']) {
    await put(root, 'dist/index.html', html);
    run('identifiers', root, 'deny-token', env);
  }
});

// Generic identifiers, canonical names and availability share normalization without compacting unrelated syntax.
test('normalization: generic and language policies', async t => {
  const root = await fixture(t, { 'dist/index.html': '<p>Swarma\u200d Runtime. In preparation.</p>' });
  for (const check of ['identifiers', 'names', 'status-language']) run(check, root);
  await put(root, 'dist/index.html', '<p>@rea\u200dder:example.org</p>');
  run('identifiers', root, 'matrix-user');
  await put(root, 'dist/index.html', '<p>Swa\u00adrm<br>Runtime</p>');
  run('names', root, 'canonical-name');
  await put(root, 'dist/index.html', '<p>availa\u200dble<br>now</p>');
  run('status-language', root, 'status-language');
});

// Normalized policy matches in filenames are redacted by every CLI, including unrelated findings.
test('normalization: diagnostic redaction', async t => {
  const root = await fixture(t, { 'dist/zz-host-al\u200dpha.html': '<p>Swarm Runtime available now</p><input>' });
  for (const [check, rule] of [['identifiers', 'deny-token'], ['names', 'canonical-name'], ['status-language', 'status-language'], ['publication-surface', 'publication-input']]) {
    const result = run(check, root, rule);
    assert.ok(!(result.stdout + result.stderr).includes('zz-host-al\u200dpha'));
    assert.match(result.stderr, /\[redacted\]/u);
  }
});

// Each standalone SVG is interpreted as XML, even when unlinked; all three text policies apply.
test('standalone SVG: neutral document and policy plants', async t => {
  const svg = text => `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="50"><text x="10" y="32">${text}</text></svg>`;
  const root = await fixture(t, { 'public/badge.svg': svg('In preparation'), 'dist/badge.svg': svg('In preparation') });
  for (const check of ['identifiers', 'names', 'status-language']) run(check, root);
  for (const [text, check, rule] of [['Swarma Chain available now', 'status-language', 'status-language'], ['Swarm&#32;Runtime', 'names', 'canonical-name'], ['zz-host-al&#x200d;pha', 'identifiers', 'deny-token']]) {
    await put(root, 'dist/badge.svg', svg(text));
    const result = run(check, root, rule);
    assert.ok(result.stderr.split('\n').includes(`dist/badge.svg: ${rule}`));
    await put(root, 'dist/badge.svg', svg('In preparation'));
    run(check, root);
  }
  await put(root, 'dist/badge.svg', '<svg xmlns="http://www.w3.org/2000/svg"><style>/* available now */ text {fill: black}</style><text>In preparation</text></svg>');
  run('status-language', root);
  // XML recovery must not silently turn a malformed document into a clean publication.
  await put(root, 'dist/badge.svg', '<svg xmlns="http://www.w3.org/2000/svg"><text>In preparation</svg>');
  for (const check of ['identifiers', 'names', 'status-language']) run(check, root, 'publication-decode');
});

// Chromium supplies line breaks between positioned SVG text blocks; CSS source is excluded from that text.
test('standalone SVG: rendered text blocks', async t => {
  const svg = (first, second) => `<svg xmlns="http://www.w3.org/2000/svg"><style>/* available now */</style><text x="0" y="20">${first}</text><text x="0" y="40">${second}</text></svg>`;
  const root = await fixture(t, { 'dist/badge.svg': svg('Swarma', 'In preparation') });
  run('status-language', root);
  const env = { IDENT_DENY_TOKENS: 'zzrevieweromega' };
  run('identifiers', root, undefined, env);
  await put(root, 'dist/badge.svg', svg('zz reviewer', 'omega'));
  run('identifiers', root, 'deny-token', env);
  await put(root, 'dist/badge.svg', svg('Swarma Chain available', 'now'));
  run('status-language', root, 'status-language');
});
