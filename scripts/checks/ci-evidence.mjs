import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { cli } from './lib.mjs';

export const requiredReports = [
  '.temp/a11y/report.json',
  '.temp/a11y/control.json',
  '.temp/a11y/geometry.json',
  '.temp/a11y/geometry-run.json',
  '.temp/contrast/report.json',
  '.temp/product-identity/report.json',
  '.temp/conventions-evidence.json',
  '.temp/conventions-a11y-default.json',
  '.temp/conventions-a11y-figures.json',
  '.temp/build-regression-evidence.json',
];

// Report completeness is mandatory even when external artifact storage is unavailable.
export async function check(root) {
  const errors = [];
  for (const path of requiredReports) {
    try {
      const file = await stat(join(root, path));
      if (!file.isFile()) errors.push(`${path}: ci-evidence-file`);
      else if (file.size === 0) errors.push(`${path}: ci-evidence-empty`);
    } catch (error) {
      errors.push(`${path}: ${error.code === 'ENOENT' ? 'ci-evidence-missing' : 'ci-evidence-unreadable'}`);
    }
  }
  return errors;
}
await cli(import.meta.url, check);
