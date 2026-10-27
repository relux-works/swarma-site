import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, put, run } from './fixture.mjs';

// Each selected JSON report must exist as a nonempty file; missing, empty and directory
// replacements reject for their specific reason, and restoring that report passes again.
test('CI evidence: all expected reports are required independently of artifact storage', async t => {
  const reports = [
    '.temp/a11y/report.json', '.temp/a11y/control.json', '.temp/a11y/geometry.json', '.temp/a11y/geometry-run.json',
    '.temp/contrast/report.json', '.temp/product-identity/report.json', '.temp/conventions-evidence.json',
    '.temp/conventions-a11y-default.json', '.temp/conventions-a11y-figures.json', '.temp/build-regression-evidence.json',
  ];
  const root = await fixture(t, Object.fromEntries(reports.map(path => [path, '{}\n'])));
  run('ci-evidence', root);
  for (const path of reports) {
    for (const kind of ['missing', 'empty', 'file']) {
      await rm(join(root, path));
      if (kind === 'empty') await put(root, path, '');
      if (kind === 'file') await mkdir(join(root, path));
      const result = run('ci-evidence', root, `ci-evidence-${kind}`);
      assert.equal(result.stderr.trim(), `${path}: ci-evidence-${kind}`);
      await rm(join(root, path), { recursive: true, force: true });
      await put(root, path, '{}\n');
      run('ci-evidence', root);
    }
  }
});
