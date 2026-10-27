import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fixture, put } from './fixture.mjs';
import conventions from '../../../src/lib/markdown-conventions.mjs';
const text = value => ({ type: 'text', value });
const paragraph = children => ({ type: 'paragraph', children });
const strong = value => ({ type: 'strong', children: [text(value)] });
async function render(t, slug, children) {
  const root = await fixture(t), path = join(root, `src/content/pages/ru/${slug}.md`);
  await put(root, `src/content/pages/ru/${slug}.md`, 'Fixture');
  const tree = { type: 'root', children };
  conventions()(tree, { path, value: 'Fixture', data: { astro: { frontmatter: { title: 'Swarma' } } } });
  return tree;
}
// Only the exact redundant label is removed; ordinary bold content and the following inline link survive.
test('limits: exact label removal preserves neighboring bold text and links', async t => {
  const link = { type: 'link', url: '/ru/book/', children: [text('Book')] };
  const tree = await render(t, 'platform', [
    { type: 'blockquote', children: [paragraph([strong('Предел.'), text(' Boundary '), link])] },
    { type: 'blockquote', children: [paragraph([strong('Предел. Содержательный текст.'), text(' Keep this.')])] },
  ]);
  assert.equal(tree.children.filter(node => node.type === 'html' && node.value.includes('<aside')).length, 1);
  const serialized = JSON.stringify(tree);
  assert.ok(serialized.includes('Boundary '));
  assert.ok(serialized.includes('Предел. Содержательный текст.'));
  assert.ok(serialized.includes('"type":"blockquote"'));
  assert.ok(serialized.includes('"url":"/ru/book/"'));
  assert.equal(serialized.includes('"value":"Предел."'), false);
});
// The complete consecutive triple becomes a description list; an interrupted triple retains its authored paragraphs.
test('principles: complete rows preserve prose; interrupted statements stay separate', async t => {
  const names = ['Swarma Runtime', 'Swarma Protocol', 'Swarma Chain'];
  const statements = () => names.map((name, i) => paragraph([strong(name + '.'), text(` Statement ${i}.`)]));
  const tree = await render(t, 'principles', statements());
  assert.equal(JSON.stringify(tree).split('<dl class=\\"layer-rows--principle\\">').length - 1, 1);
  for (let i = 0; i < 3; i++) assert.ok(JSON.stringify(tree).includes(`Statement ${i}.`));
  const interrupted = statements(); interrupted.splice(1, 0, paragraph([text('Other paragraph.')]));
  const other = await render(t, 'principles', interrupted);
  assert.equal(JSON.stringify(other).includes('layer-rows--principle'), false);
  assert.equal(other.children.filter(node => node.type === 'paragraph').length, 4);
});

// An index helps choose between sections: zero and one section omit it, while two retain ordered anchors.
test('index: zero and one section omit navigation; two sections retain ordered links', async t => {
  for (const count of [0, 1, 2]) {
    const children = [paragraph([text('Introduction.')])];
    for (let i = 0; i < count; i++) children.push({ type: 'heading', depth: 2, children: [text(`Section ${i + 1}`)] }, paragraph([text('Body.')])) ;
    const tree = await render(t, 'platform', children);
    const indexes = tree.children.filter(node => node.type === 'html' && node.value.includes('<nav class="section-index"'));
    assert.equal(indexes.length, count >= 2 ? 1 : 0, `section count ${count}`);
    if (count === 2) {
      assert.ok(indexes[0].value.indexOf('href="#section-1"') < indexes[0].value.indexOf('href="#section-2"'));
      assert.ok(indexes[0].value.includes('<details><summary>'));
    }
  }
});
