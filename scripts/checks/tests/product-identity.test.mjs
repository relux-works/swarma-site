import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fixture, put, page as content } from './fixture.mjs';
import { openBrowser } from '../publication/browser.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
async function verify(page, locale, variant) {
  const footer = page.locator('footer .product-lockup');
  assert.equal(await footer.count(), 1, 'identity-footer-count');
  assert.equal(await footer.evaluate(node => node.parentElement.firstElementChild === node), true, 'identity-footer-order');
  const records = [];
  for (const landmark of ['header', 'footer']) {
    const logo = page.locator(`${landmark} .product-lockup`), image = logo.locator('img');
    assert.equal(await logo.count(), 1, `identity-${landmark}-count`);
    assert.equal(await page.locator(landmark).getByRole('link', { name: 'Swarma', exact: true }).count(), 1, `identity-${landmark}-name`);
    assert.equal(await logo.getAttribute('href'), `/${locale}/`, `identity-${landmark}-home`);
    assert.equal(await image.getAttribute('alt'), '', `identity-${landmark}-decoration`);
    await image.evaluate(node => node.decode());
    const state = await logo.evaluate(node => {
      const image = node.querySelector('img'), rect = image.getBoundingClientRect();
      const style = getComputedStyle(node), artwork = getComputedStyle(image);
      return { selected: new URL(image.currentSrc).pathname, width: rect.width, height: rect.height,
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(parseFloat),
        filter: artwork.filter, transform: artwork.transform, direction: style.direction, isolation: style.unicodeBidi };
    });
    assert.equal(state.selected, `/brand/swarma-lockup-horizontal${variant}.svg`, `identity-${landmark}-variant`);
    assert.ok(state.width >= 160, `identity-${landmark}-minimum`);
    assert.ok(Math.abs(state.height - state.width * 120 / 344) < .1, `identity-${landmark}-ratio`);
    assert.ok(state.padding.every(value => value >= 12 * state.width / 344), `identity-${landmark}-clear-space`);
    assert.equal(state.filter, 'none'); assert.equal(state.transform, 'none');
    assert.equal(state.direction, 'ltr'); assert.equal(state.isolation, 'isolate');
    records.push({ landmark, ...state });
  }
  assert.equal(await page.locator('footer').getByRole('link', { name: 'Relux Works', exact: true }).count(), 1);
  assert.equal(await footer.evaluate(node => Boolean(node.compareDocumentPosition(node.parentElement.querySelector('.relationship')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  return records;
}

// Actual Astro output selects unchanged artwork in four palettes, at four widths in both locales;
// missing/order/variant/alternative/size/space violations reject, with a restored positive control after each plant.
test('product identity: footer order, accessible links and system artwork variants', async t => {
  const root = await fixture(t);
  for (const path of ['src', 'public', 'config', 'scripts', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(join(repository, path), join(root, path), { recursive: true,
      filter: path => path !== join(repository, 'scripts/checks/tests') });
  }
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  await put(root, 'src/content/pages/en/index.md', content('', 'Swarma.'));
  await put(root, 'src/content/pages/en/platform.md', content('', 'Platform.').replace('title: Swarma', 'title: Platform'));
  const build = spawnSync(process.execPath, [join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root],
    { cwd: root, encoding: 'utf8', timeout: 60000, env: { ...process.env, SWARMA_BOOK_FIGURES: '0' } });
  assert.ifError(build.error); assert.equal(build.status, 0, build.stdout + build.stderr);
  const output = join(repository, '.temp/product-identity'); await mkdir(output, { recursive: true });
  const session = await openBrowser(root), states = [], plants = [];
  try {
    const page = await session.browser.newPage();
    // Intercept the entire reserved test origin; no real server or external request is needed.
    await page.route('http://example.test/**', async request => {
      const pathname = new URL(request.request().url()).pathname;
      const path = join(root, 'dist', pathname, pathname.endsWith('/') ? 'index.html' : '');
      const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[extname(path)] ?? 'application/octet-stream';
      try { await request.fulfill({ body: await readFile(path), contentType: type }); }
      catch { await request.fulfill({ status: 404, body: 'Not found' }); }
    });
    for (const locale of ['ru', 'en']) for (const width of [390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, colorScheme, forcedColors, variant] of [
        ['light', 'light', 'none', ''], ['dark', 'dark', 'none', '-dark'],
        ['forced-light', 'light', 'active', '-mono'], ['forced-dark', 'dark', 'active', '-white'],
      ]) {
        await page.emulateMedia({ colorScheme, forcedColors, reducedMotion: 'reduce' });
        await page.goto(`http://example.test/${locale}/platform/`); await page.evaluate(() => document.fonts.ready);
        states.push({ locale, width, appearance: name, logos: await verify(page, locale, variant) });
        if (locale === 'ru') await page.screenshot({ path: join(output, `${width}-${name}.png`), fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    const restore = async () => { await page.goto('http://example.test/ru/platform/'); await verify(page, 'ru', '-white'); };
    await restore();
    for (const [name, plant, diagnostic] of [
      ['missing footer', () => document.querySelector('footer .product-lockup').remove(), /identity-footer-count/],
      ['footer order', () => { const node = document.querySelector('footer .product-lockup'); node.parentElement.append(node); }, /identity-footer-order/],
      ['missing forced variants', () => document.querySelectorAll('header picture source[media*="forced-colors"]').forEach(node => node.remove()), /identity-header-variant/],
      ['duplicate alternative', () => { document.querySelector('header .product-lockup img').alt = 'Swarma'; }, /identity-header-decoration/],
      ['small artwork', () => { document.querySelector('header .product-lockup img').style.width = '159px'; }, /identity-header-minimum/],
      ['missing clear space', () => { document.querySelector('footer .product-lockup').style.padding = '0'; }, /identity-footer-clear-space/],
    ]) {
      await page.evaluate(plant);
      await assert.rejects(verify(page, 'ru', '-white'), diagnostic);
      await restore(); plants.push({ name, diagnostic: diagnostic.source, rejected: true, restored: true });
    }
  } finally {
    await writeFile(join(output, 'report.json'), JSON.stringify({ browser: session.browser.version(), states, plants }, null, 2) + '\n');
    await session.close();
  }
});
