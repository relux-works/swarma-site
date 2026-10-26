import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Resolve the installed browser before child HOME changes to isolate the external policy.
const browserExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath();
const repository = fileURLToPath(new URL('../../..', import.meta.url));
export async function fixture(t, entries = {}) {
  const scratch = join(repository, '.temp/check-fixtures');
  await mkdir(scratch, { recursive: true });
  const root = await mkdtemp(join(scratch, 'case-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await put(root, 'config/public-repos.json', '{"repositories":[],"emails":[]}');
  await put(root, 'config/publication-surface.json', '{"allow":[]}');
  for (const [path, value] of Object.entries(entries)) await put(root, path, value);
  return root;
}
export async function put(root, path, value) {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, value);
}
export function run(name, root, rule, env = {}) {
  const result = spawnSync(process.execPath, [resolve(repository, `scripts/checks/${name}.mjs`)], {
    cwd: root, encoding: 'utf8', timeout: 120000,
    env: { ...process.env, HOME: root, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: browserExecutable, CI: '', IDENT_DENY_TOKENS: 'zz-host-alpha', IDENT_DENY_TOKENS_OPTIONAL: '', ...env },
  });
  assert.ifError(result.error);
  assert.equal(result.status, rule ? 1 : 0, result.stdout + result.stderr);
  if (rule) assert.ok(result.stderr.split('\n').some(line => line === rule || line.endsWith(`: ${rule}`) || line.startsWith(`${rule}: `)), result.stderr);
  return result;
}
export const page = (fields = '', body = 'Страница готовится.') => `---\ntitle: Swarma\ndescription: Page\norder: 1\nnav: true\n${fields}---\n${body}\n`;
