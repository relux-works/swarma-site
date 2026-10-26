import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { document, filesAt } from '../lib.mjs';
import { fixture, put, run, page } from './fixture.mjs';
import { plants, reviewPlants } from './publication-fixture.mjs';
import { encodedIdentifiers } from './identifier-fixture.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
const evidence = [];
after(async () => {
  await mkdir(join(repository, '.temp'), { recursive: true });
  await writeFile(join(repository, '.temp/build-regression-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
});

async function sourceFixture(t) {
  const root = await fixture(t);
  for (const path of ['src', 'config', 'astro.config.mjs', 'package.json', 'tsconfig.json']) await cp(join(repository, path), join(root, path), { recursive: true });
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  return root;
}
function build(root) {
  const result = spawnSync(process.execPath, [join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root], { cwd: root, encoding: 'utf8', timeout: 60000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
}
async function layoutPlant(root, html, extraImport = '') {
  const path = join(root, 'src/layouts/Page.astro');
  const source = await readFile(path, 'utf8');
  await writeFile(path, source.replace('---\n', `---\n${extraImport}`).replace('<slot />', `<slot />${html}`));
}
function verdict(name, check, root, rule) {
  const result = run(check, root, rule);
  evidence.push({ name, check, buildExit: 0, checkExit: result.status, diagnostic: result.stderr.trim() || result.stdout.trim() });
}

// A real build accepts the complete canonical StatusTable and an independent StatusRow component use.
test('build: canonical table and standalone row controls', async t => {
  const root = await sourceFixture(t);
  await layoutPlant(root, '<table><tbody><StatusRow id="swarma" /></tbody></table>', "import StatusRow from '../components/StatusRow.astro';\n");
  build(root);
  verdict('canonical table and standalone row', 'status-language', root);
  verdict('supported publication surface', 'publication-surface', root);
});

// All unsupported features and reviewer witnesses survive the real public-to-dist build and fail by file/rule.
test('build: unsupported publication surfaces are rejected', async t => {
  const root = await sourceFixture(t);
  const cases = [...plants, ...reviewPlants];
  for (const [index, [, html]] of cases.entries()) await put(root, `public/probe-${index}.html`, html);
  build(root);
  const result = run('publication-surface', root, 'publication-input');
  for (const [index, [name, html, rule]] of cases.entries()) {
    assert.equal(await readFile(join(root, `dist/probe-${index}.html`), 'utf8'), html);
    assert.ok(result.stderr.split('\n').includes(`dist/probe-${index}.html: ${rule}`), result.stderr);
    evidence.push({ name, check: 'publication-surface', buildExit: 0, checkExit: result.status, diagnostic: `dist/probe-${index}.html: ${rule}` });
  }
});

// A forged marker in layout code cannot turn an invented availability claim into book status.
test('build: forged layout marker is rejected', async t => {
  const root = await sourceFixture(t);
  await layoutPlant(root, '<p data-status-source="book-1.6.1">Swarma Chain is available now.</p>');
  build(root);
  verdict('forged layout marker', 'status-language', root, 'status-provenance');
  run('status-language', root, 'status-marker-location');
});

// Changing a marked component cell fails even though the marker remains in an allowed source file.
test('build: changed marked cell is rejected', async t => {
  const root = await sourceFixture(t);
  const path = join(root, 'src/components/StatusRow.astro');
  await writeFile(path, (await readFile(path, 'utf8')).replace('<td>{row.works_today}</td>', '<td>available now</td>'));
  build(root);
  verdict('changed marked cell', 'status-language', root, 'status-provenance');
});

// An extra neutral descendant in a marked cell fails structural provenance, independently of availability language.
test('build: extra marked descendant is rejected', async t => {
  const root = await sourceFixture(t);
  const path = join(root, 'src/components/StatusRow.astro');
  await writeFile(path, (await readFile(path, 'utf8')).replace('<td>{row.not_yet}</td>', '<td><span>{row.not_yet}</span></td>'));
  build(root);
  verdict('extra marked descendant', 'status-language', root, 'status-provenance');
});

// An availability claim adjacent to the genuine table remains outside its validated exemption.
test('build: adjacent prose is rejected', async t => {
  const root = await sourceFixture(t);
  await layoutPlant(root, '<p>available now</p>');
  build(root);
  verdict('adjacent prose', 'status-language', root, 'status-language');
});

// Working encoded links copied from public into dist fail the exact identifier rules after a real build.
test('build: encoded public links are rejected', async t => {
  const root = await sourceFixture(t);
  await put(root, 'public/probe.html', '<a href="mailto:reader&#64;example.org">Contact</a><a href="https://github.com/relux-works/&#112;rivate-example">Source</a>');
  build(root);
  assert.equal(await readFile(join(root, 'dist/probe.html'), 'utf8'), await readFile(join(root, 'public/probe.html'), 'utf8'));
  verdict('encoded public email and repository link', 'identifiers', root, 'email');
  run('identifiers', root, 'private-repository');
});

// Encoded accessible names and availability labels emitted by the actual layout fail their own policies.
test('build: accessible labels are rejected', async t => {
  const root = await sourceFixture(t);
  await layoutPlant(root, '<a href="/" aria-label="Swarm&#32;Runtime">Platform</a><a href="/" aria-label="Swarma Chain available&#32;now">Chain</a><img src="/image.png" alt="reader&#64;example.org" />');
  build(root);
  verdict('encoded accessible product name', 'names', root, 'canonical-name');
  verdict('encoded accessible availability', 'status-language', root, 'status-language');
  verdict('encoded image email', 'identifiers', root, 'email');
});

// The review's common plural is rejected in both authored source and rendered output.
test('build: plural availability is rejected', async t => {
  const root = await sourceFixture(t);
  const path = join(root, 'src/content/pages/ru/index.md');
  await writeFile(path, `${await readFile(path, 'utf8')}\nRuntime и Chain работают сегодня.\n`);
  build(root);
  verdict('plural availability', 'status-language', root, 'status-language');
});

function nodes(node) { return [node, ...(node.childNodes ?? []).flatMap(nodes)]; }
const attr = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
async function verifyHomeLinks(root, expected) {
  const html = await readFile(join(root, 'dist/en/platform/runtime/index.html'), 'utf8');
  const parsed = nodes(document(html));
  const wordmark = parsed.find(node => node.tagName === 'a' && attr(node, 'class') === 'wordmark');
  assert.equal(attr(wordmark, 'href'), expected);
  assert.equal(attr(parsed.find(node => node.tagName === 'html'), 'lang'), 'en');
  for (const path of (await filesAt(root, 'dist')).filter(path => path.endsWith('.html'))) {
    for (const node of nodes(document(await readFile(path, 'utf8')))) {
      if (node.tagName === 'a' && attr(node, 'href')?.startsWith('/')) await readFile(join(root, 'dist', attr(node, 'href'), 'index.html'));
    }
  }
}

// With a lone nested English counterpart the wordmark uses the root selector and every built internal link resolves.
test('build: lone English counterpart has an existing home link', async t => {
  const root = await sourceFixture(t);
  await put(root, 'src/content/pages/en/platform/runtime.md', page('', 'Page in preparation.'));
  build(root);
  await verifyHomeLinks(root, '/');
  assert.ok(!(await filesAt(root, 'dist/en')).includes(join(root, 'dist/en/index.html')));
  evidence.push({ name: 'lone English counterpart', buildExit: 0, wordmark: '/', internalLinks: 'all resolved' });
});

// When the English home also exists the wordmark uses it, and root locale selection remains Russian first.
test('build: complete English home uses its own route', async t => {
  const root = await sourceFixture(t);
  await put(root, 'src/content/pages/en/platform/runtime.md', page('', 'Page in preparation.'));
  await put(root, 'src/content/pages/en/index.md', page('', 'Page in preparation.'));
  build(root);
  await verifyHomeLinks(root, '/en/');
  const rootNodes = nodes(document(await readFile(join(root, 'dist/index.html'), 'utf8')));
  const main = rootNodes.find(node => node.tagName === 'main');
  assert.deepEqual(nodes(main).filter(node => node.tagName === 'a').map(node => attr(node, 'href')), ['/ru/', '/en/']);
  evidence.push({ name: 'English home and counterpart', buildExit: 0, wordmark: '/en/', internalLinks: 'all resolved' });
});

// Actual public-to-dist builds preserve encoded JSON/CSS/markup witnesses; the production identifier CLI rejects every output file.
test('build: decoded publication identifiers fail after clean controls', async t => {
  const root = await sourceFixture(t);
  for (const [index, [, suffix, , , clean]] of encodedIdentifiers.entries()) {
    await put(root, `public/policy-${index}.${suffix}`, clean);
    await put(root, `public/generic-${index}.${suffix}`, clean);
  }
  build(root);
  verdict('encoded publication clean controls', 'identifiers', root);
  for (const [index, [, suffix, external, generic]] of encodedIdentifiers.entries()) {
    await put(root, `public/policy-${index}.${suffix}`, external);
    await put(root, `public/generic-${index}.${suffix}`, generic);
  }
  build(root);
  const result = run('identifiers', root, 'deny-token');
  assert.ok(!(result.stdout + result.stderr).toLowerCase().includes('zz-host-alpha'));
  for (const [index, [name, suffix, external, generic, , genericRule = 'matrix-user']] of encodedIdentifiers.entries()) {
    for (const [prefix, value, rule] of [['policy', external, 'deny-token'], ['generic', generic, genericRule]]) {
      const path = `dist/${prefix}-${index}.${suffix}`;
      assert.equal(await readFile(join(root, path), 'utf8'), value);
      assert.ok(result.stderr.split('\n').includes(`${path}: ${rule}`), result.stderr);
      evidence.push({ name, check: 'identifiers', buildExit: 0, checkExit: result.status, diagnostic: `${path}: ${rule}` });
    }
  }
});

// Real public-to-dist copying preserves the witnesses; each output rejects for its intended rule.
test('build: structural encoding and CommonMark witnesses', async t => {
  const root = await sourceFixture(t);
  const clean = { 'public/encoding.html': '<p>Swarma</p>', 'public/encoding.svg': '<svg><text>Swarma</text></svg>', 'public/emphasis.md': 'Swarma **Runtime**' };
  for (const [path, value] of Object.entries(clean)) await put(root, path, value);
  build(root);
  verdict('structural build clean controls', 'identifiers', root);
  const cases = [
    ['encoding.html', Buffer.concat([Buffer.from([255, 254]), Buffer.from('<p>zz-host-&#97;lpha</p>', 'utf16le')]), 'publication-decode'],
    ['encoding.svg', Buffer.concat([Buffer.from([255, 254]), Buffer.from('<svg><text>&#64;reader:example.org</text></svg>', 'utf16le')]), 'publication-decode'],
    ['emphasis.md', Buffer.from('zz-host-**alpha**'), 'deny-token'],
    ['generic.md', Buffer.from('@rea**der**:example.org'), 'matrix-user'],
  ];
  for (const [path, value] of cases) await put(root, `public/${path}`, value);
  build(root);
  const result = run('identifiers', root, 'publication-decode');
  for (const [path, value, rule] of cases) {
    assert.deepEqual(await readFile(join(root, 'dist', path)), value);
    assert.ok(result.stderr.split('\n').includes(`dist/${path}: ${rule}`), result.stderr);
    evidence.push({ name: path, check: 'identifiers', buildExit: 0, checkExit: 1, diagnostic: `dist/${path}: ${rule}` });
  }
  // The npm lifecycle gate rejects invalid source bytes before replacing the previous output.
  await cp(join(repository, 'scripts'), join(root, 'scripts'), { recursive: true });
  const before = await readFile(join(root, 'dist/index.html'));
  const guarded = spawnSync('npm', ['run', 'build'], { cwd: root, encoding: 'utf8', timeout: 90000, env: { ...process.env, HOME: root, IDENT_DENY_TOKENS: 'zz-host-alpha' } });
  assert.ifError(guarded.error);
  assert.equal(guarded.status, 1, guarded.stdout + guarded.stderr);
  assert.match(guarded.stderr, /publication-decode/u);
  assert.deepEqual(await readFile(join(root, 'dist/index.html')), before);
  evidence.push({ name: 'prebuild encoding gate preserves previous output', buildExit: 1, diagnostic: 'publication-decode', previousOutputPreserved: true });
});
