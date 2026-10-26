import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import { pageSchema } from '../../src/lib/page-schema.mjs';
import { cli, filesAt } from './lib.mjs';

export async function check(root) {
  const errors = [];
  const base = join(root, 'src/content/pages');
  const files = (await filesAt(root, 'src/content/pages')).filter(file => file.endsWith('.md'));
  const ids = new Set(files.map(file => relative(base, file).replace(/\.md$/, '')));
  if (!ids.size) errors.push('i18n-empty: no pages');
  for (const file of files) {
    const id = relative(base, file).replace(/\.md$/, '');
    if (!/^(?:ru|en)\/[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(id)) errors.push(`${id}: i18n-slug`);
    if (id.startsWith('en/') && !ids.has(`ru/${id.slice(3)}`)) errors.push(`${id}: i18n-counterpart`);
    try {
      const { data } = matter(await readFile(file, 'utf8'));
      if (!pageSchema.safeParse(data).success) errors.push(`${id}: i18n-frontmatter`);
    } catch { errors.push(`${id}: i18n-frontmatter`); }
  }
  return errors;
}
await cli(import.meta.url, check);
