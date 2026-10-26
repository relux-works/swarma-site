import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, put, run, page } from './fixture.mjs';
import { pageId } from '../../../src/lib/page-schema.mjs';

// Explicit content IDs retain the home index and nested paths, so counterpart lookup cannot lose a locale home.
test('i18n loader IDs preserve index and nested slugs', () => {
  assert.equal(pageId({ entry: 'ru/index.md' }), 'ru/index');
  assert.equal(pageId({ entry: 'en/index.md' }), 'en/index');
  assert.equal(pageId({ entry: 'ru/platform/runtime.md' }), 'ru/platform/runtime');
});

// Russian-only pages and complete English counterparts with matching nested slugs both pass.
test('i18n positive controls', async t => {
  const root = await fixture(t, { 'src/content/pages/ru/platform/runtime.md': page() });
  run('i18n', root);
  await put(root, 'src/content/pages/en/platform/runtime.md', page('', 'Page in preparation.'));
  run('i18n', root);
});
// An English page without the exact Russian slug fails even when a different Russian page exists.
test('i18n counterpart required', async t => {
  const root = await fixture(t, { 'src/content/pages/ru/index.md': page(), 'src/content/pages/en/platform.md': page() });
  run('i18n', root, 'i18n-counterpart');
});
// Missing, mistyped, empty or unsupported metadata cannot bypass the shared content schema.
for (const [index, content] of [page().replace('title: Swarma\n', ''), page().replace('description: Page', 'description: ""'), page().replace('order: 1', 'order: "first"'), page().replace('nav: true', 'nav: 1'), page('slug: other\n'), '---\ntitle: [\n---'].entries()) test(`i18n metadata plant ${index}`, async t => {
  const root = await fixture(t, { 'src/content/pages/ru/index.md': content });
  run('i18n', root, 'i18n-frontmatter');
});
// Unsupported locales and noncanonical path slugs fail instead of generating ambiguous routes.
for (const path of ['fr/index', 'ru/Bad Slug']) test(`i18n path plant ${path}`, async t => {
  const root = await fixture(t, { [`src/content/pages/${path}.md`]: page() });
  run('i18n', root, 'i18n-slug');
});
// An empty tree cannot satisfy the localization check vacuously.
test('i18n empty tree', async t => { run('i18n', await fixture(t), 'i18n-empty'); });
