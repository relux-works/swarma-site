import test from 'node:test';
import { fixture, run } from './fixture.mjs';

// Canonical product names and ordinary bilingual prose pass the publication scanner.
test('names canonical positive control', async t => {
  const root = await fixture(t, { 'src/sample.md': 'Swarma Runtime, Swarma Protocol, Swarma Chain, Swarma Keeper, Swarma Curator, Swarma Keyholder, Swarma Signer, подписант, signer. Страница готовится. Высоты и красоты.' });
  run('names', root);
});
// Every prohibited name or metaphor fails with the canonical-name rule.
for (const name of ['Swarm Runtime', 'Swarm Protocol', 'Swarm Chain', 'Swarm Keeper', 'Swarm Curator', 'Swarm Signer', 'Colony', 'Swarm cell', 'пасека', 'улей', 'ульи', 'пчёлы', 'пчелы', 'соты', 'Apiary', 'slopcore', 'waggle']) test(`names plant ${name}`, async t => {
  const root = await fixture(t, { 'src/sample.md': name });
  run('names', root, 'canonical-name');
});
// All publication scan roots and case folding are enforced by the real CLI.
for (const path of ['src/sample.txt', 'public/sample.txt', 'docs/sample.md', 'README.md', 'dist/index.html']) test(`names scans ${path}`, async t => {
  const root = await fixture(t, { [path]: 'SWARM RUNTIME' });
  run('names', root, 'canonical-name');
});
// Inline HTML boundaries cannot hide a prohibited rendered name.
test('names split rendered name', async t => {
  const root = await fixture(t, { 'dist/index.html': '<p>Swarm <em>Runtime</em></p>' });
  run('names', root, 'canonical-name');
});

// Decoded accessible text and metadata obey the name policy; canonical text remains valid.
for (const attribute of ['alt', 'aria-label', 'aria-description', 'title', 'content']) test(`names decoded ${attribute}`, async t => {
  const root = await fixture(t, { 'dist/index.html': `<meta ${attribute}="Swarm&#32;Runtime">` });
  run('names', root, 'canonical-name');
});

// The decoded-attribute check does not reject canonical names in ordinary image labels or metadata.
test('names accessible positive control', async t => {
  const root = await fixture(t, { 'dist/index.html': '<img src="/image.png" alt="Swarma&#32;Runtime"><a href="/" aria-label="Swarma Protocol" title="Swarma">Platform</a><meta name="description" content="Swarma Chain">' });
  run('names', root);
});
