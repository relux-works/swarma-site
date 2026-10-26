import test from 'node:test';
import { fixture, run, put } from './fixture.mjs';
import { plants, reviewPlants } from './publication-fixture.mjs';

// Supported semantic markup, normal URLs, decoded image data and a valueless button need no exception.
test('publication surface clean control', async t => {
  const html = '<!doctype html><html lang="ru"><head><meta name="description" content="Swarma Signer"><style>@media (min-width: 1px) { p { color: inherit !important; } }</style></head><body><main><a href="/ru/">Swarma</a><img src="d&#97;ta:image/png;base64,AA==" alt="Image"><button type="button">Details</button></main></body></html>';
  const root = await fixture(t, { 'src/layouts/Page.astro': `---\nconst example = '<input>';\n---\n${html}`, 'public/clean.html': html, 'dist/index.html': html });
  run('publication-surface', root);
  // Frontmatter is excluded from the HTML surface, while actual template markup remains checked.
  await put(root, 'src/layouts/Page.astro', `---\nconst example = '<input>';\n---\n<input>`);
  run('publication-surface', root, 'publication-input');
});

// Each unused HTML feature fails its own named rule in both source and built output, without forbidden prose.
for (const [name, html, rule] of plants) test(`publication feature plant: ${name}`, async t => {
  const root = await fixture(t, { 'src/components/Probe.astro': html });
  run('publication-surface', root, rule);
  await put(root, 'src/components/Probe.astro', '<p>Details</p>');
  await put(root, 'dist/probe.html', html);
  run('publication-surface', root, rule);
});

// Every reviewer witness rejects the unsupported surface, independent of text extraction or JavaScript mode.
for (const [name, html, rule] of reviewPlants) test(`publication review plant: ${name}`, async t => {
  const root = await fixture(t, { 'dist/probe.html': html });
  run('publication-surface', root, rule);
});

// All component, layout and page roots plus public and non-HTML-named output are covered.
for (const path of ['src/layouts/Probe.astro', 'src/pages/probe.astro', 'src/content/pages/ru/probe.md', 'src/components/Probe.tsx', 'public/probe.html', 'dist/nested/probe', 'dist/image.svg']) test(`publication scan root ${path}`, async t => {
  const root = await fixture(t, { [path]: '<input>' });
  run('publication-surface', root, 'publication-input');
});

// Nested HTML, foreign content, source expressions and normalized URL variants still fail closed.
for (const [index, [source, expected]] of [
  ['<template><input></template>', 'publication-input'],
  ['<svg><foreignObject><input></foreignObject></svg>', 'publication-input'],
  ['<a onclick={handler}>Details</a>', 'publication-event-handler'],
  ['<a href="java&#10;script:alert(1)">Details</a>', 'publication-javascript-url'],
  ['<div style="background:url(data:text/html,example)">Details</div>', 'publication-data-url'],
  ['<img srcset="data:text/html,example 1x, /image.png 2x">', 'publication-data-url'],
  ['<button value={label}>Details</button>', 'publication-button-value'],
].entries()) test(`publication neighboring variant ${index}`, async t => {
  const root = await fixture(t, { 'dist/probe.html': source });
  run('publication-surface', root, expected);
});

// A documented allowance covers one exact file/rule, never a neighboring file or another rule.
test('publication allowance is narrow and requires a reason', async t => {
  const entry = { path: 'dist/probe.html', rule: 'publication-input', reason: 'Isolated control for exact exception matching.' };
  const root = await fixture(t, { 'config/publication-surface.json': JSON.stringify({ allow: [entry] }), 'dist/probe.html': '<input>' });
  run('publication-surface', root);
  await put(root, 'dist/neighbor.html', '<input>');
  run('publication-surface', root, 'publication-input');
  await put(root, 'dist/neighbor.html', '<p>Details</p>');
  await put(root, 'dist/probe.html', '<input onclick="return false">');
  run('publication-surface', root, 'publication-event-handler');
});

// Invalid, broad, undocumented, unknown or duplicate exceptions cannot silently disable enforcement.
for (const allow of [null, [{}], [{ path: 'dist/*', rule: 'publication-input', reason: 'Example' }], [{ path: 'dist/../probe.html', rule: 'publication-input', reason: 'Example' }], [{ path: 'dist/probe.html', rule: 'publication-input', reason: '' }], [{ path: 'dist/probe.html', rule: 'unknown', reason: 'Example' }], Array(2).fill({ path: 'dist/probe.html', rule: 'publication-input', reason: 'Example' })]) test(`publication invalid allowance ${JSON.stringify(allow)}`, async t => {
  const root = await fixture(t, { 'config/publication-surface.json': JSON.stringify({ allow }) });
  run('publication-surface', root, 'publication-config');
});
