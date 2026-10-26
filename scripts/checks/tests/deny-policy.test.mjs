import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fixture, put, run } from './fixture.mjs';
import { readDenyTokens, readDenyTokensSync, splitTokens } from '../publication/policy.mjs';

// Both async checks and synchronous diagnostics reject invalid policy; the supervised CI entry cannot use local fallback.
test('deny policy: strict ASCII configuration and source precedence', async t => {
  const home = await fixture(t, { '.config/swarma-site/deny-tokens.txt': 'zz-host-alpha\nzz_host.beta0\n' });
  const file = home + '/.config/swarma-site/deny-tokens.txt';
  assert.deepEqual(splitTokens(' \tzz-host-alpha,\r\nzz_host.beta0\f'), ['zz-host-alpha', 'zz_host.beta0']);
  assert.deepEqual(await readDenyTokens(file, '', ''), ['zz-host-alpha', 'zz_host.beta0']);
  assert.deepEqual(readDenyTokensSync(file, '', ''), ['zz-host-alpha', 'zz_host.beta0']);
  assert.deepEqual(await readDenyTokens(file, 'zz-other-policy', 'true'), ['zz-other-policy']);
  assert.deepEqual(readDenyTokensSync(file, 'zz-other-policy', 'true'), ['zz-other-policy']);
  const root = await fixture(t, { 'dist/ΟΣ report.html': '<p>Swarm Runtime available now</p><input>' });
  const workflow = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const block = workflow.match(/^ {8}run: \|\n((?: {10}[^\n]*\n)+)/mu)[1].trimEnd().split('\n').map(line => line.slice(10)).join('\n');
  assert.match(block, /^node scripts\/run\.mjs bash -c '/u);
  assert.match(block, /node scripts\/checks\/deny-policy\.mjs\n {2}npm run check/u);
  const repository = new URL('../../../', import.meta.url);
  for (const token of ['', ' , ', 'ΟΣ', '\u200d', '\u00a0zz-host-alpha', 'zz-token\u2028', 'ZZ-HOST-ALPHA', 'zz host alpha', 'zz.host+alpha', 'ab', 'zz-valid,ΟΣ']) {
    assert.throws(() => splitTokens(token), { rule: 'identifier-deny-tokens' });
    await assert.rejects(readDenyTokens(file, token, 'true'), { rule: 'identifier-deny-tokens' });
    assert.throws(() => readDenyTokensSync(file, token, 'true'), { rule: 'identifier-deny-tokens' });
    await put(home, '.config/swarma-site/deny-tokens.txt', token);
    await assert.rejects(readDenyTokens(file, '', ''), { rule: 'identifier-deny-tokens' });
    assert.throws(() => readDenyTokensSync(file, '', ''), { rule: 'identifier-deny-tokens' });
    for (const check of ['identifiers', 'names', 'status-language', 'publication-surface']) {
      const result = run(check, root, 'identifier-deny-tokens', { HOME: home, IDENT_DENY_TOKENS: token, CI: 'true' });
      assert.equal(result.stderr.trim(), 'identifier-deny-tokens: cannot read external deny tokens');
      assert.ok(!(result.stdout + result.stderr).includes('ΟΣ'));
    }
    await put(home, '.config/swarma-site/deny-tokens.txt', 'zz-host-alpha');
    const guarded = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', block], {
      cwd: repository, encoding: 'utf8', env: { ...process.env, HOME: home, CI: 'true', IDENT_DENY_TOKENS: token },
    });
    assert.equal(guarded.status, 1, guarded.stdout + guarded.stderr);
    assert.equal(guarded.stdout, '');
    assert.equal(guarded.stderr.trim(), 'diagnostic-boundary: command unavailable');
  }
});

// Valid lowercase policy still detects uppercase ASCII in ordinary prose and redacts a space-suffixed filename.
test('deny policy: valid ASCII detection and diagnostic controls', async t => {
  const root = await fixture(t, { 'dist/index.html': '<p>before ZZ-HOST-ALPHA after</p>' });
  run('identifiers', root, 'deny-token');
  await put(root, 'dist/index.html', '<p>Swarma Runtime. In preparation. ΟΣ. Русский текст.</p>');
  for (const check of ['identifiers', 'names', 'status-language', 'publication-surface']) run(check, root);
  await put(root, 'dist/ZZ-HOST-ALPHA report.html', '<p>Swarm Runtime available now</p><input>');
  for (const [check, rule] of [['identifiers', 'deny-token'], ['names', 'canonical-name'], ['status-language', 'status-language'], ['publication-surface', 'publication-input']]) {
    const result = run(check, root, rule);
    assert.ok(!(result.stdout + result.stderr).toLowerCase().includes('zz-host-alpha'));
    assert.match(result.stderr, /\[redacted\]/u);
  }
});
