import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, symlink, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fixture, put } from './fixture.mjs';
import { builtSite, builtRoutes, visualContract } from '../visual-contract.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
// Inventory follows content paths plus the selector and 404; missing, substituted and extra HTML must fail.
// This qualifies route coverage, not the validity of page content or its measured layout.
test('visual contract: route inventory includes 404 and rejects missing or extra pages', async t => {
  const entries = {
    'src/content/pages/ru/index.md': '', 'src/content/pages/en/index.md': '',
    'src/content/pages/ru/platform/runtime.md': '',
    'dist/index.html': '', 'dist/404.html': '', 'dist/ru/index.html': '',
    'dist/en/index.html': '', 'dist/ru/platform/runtime/index.html': '', 'dist/asset.css': '',
  };
  const root = await fixture(t, entries);
  const expected = ['/', '/404.html', '/en/', '/ru/', '/ru/platform/runtime/'];
  assert.deepEqual(await builtRoutes(root), expected);
  for (const [removed, added, diagnostic] of [
    ['dist/404.html', null, /missing \/404\.html; extra none/],
    ['dist/ru/platform/runtime/index.html', null, /missing \/ru\/platform\/runtime\/; extra none/],
    [null, 'dist/extra.html', /missing none; extra \/extra\.html/],
    ['dist/404.html', 'dist/extra.html', /missing \/404\.html; extra \/extra\.html/],
  ]) {
    if (removed) await rm(join(root, removed));
    if (added) await put(root, added, '');
    await assert.rejects(builtRoutes(root), diagnostic);
    if (added) await rm(join(root, added));
    if (removed) await put(root, removed, entries[removed]);
    assert.deepEqual(await builtRoutes(root), expected);
  }
});
// Each isolated browser mutation must fail its named measurement; reload restores the actual built positive control.
// These controls qualify the layout instrument, not operating-system assistive technology or arbitrary content.
test('visual contract: built pages and individual planted violations', { timeout: 180000 }, async t => {
  const root = await fixture(t);
  for (const path of ['src', 'public', 'config', 'scripts', 'astro.config.mjs', 'package.json', 'tsconfig.json']) await cp(join(repository, path), join(root, path), { recursive: true, filter: path => path !== join(repository, 'scripts/checks/tests') });
  await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
  const build = spawnSync(process.execPath, [join(repository, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', root], { cwd: root, encoding: 'utf8', timeout: 60000, env: { ...process.env, SWARMA_BOOK_FIGURES: '0' } });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const site = await builtSite(root), evidence = [];
  const css = value => ({ css: value });
  const dom = value => ({ dom: value });
  const runtime = '/ru/platform/runtime/', platform = '/ru/platform/', home = '/ru/', principles = '/ru/principles/';
  const cases = [
    ['header-height', runtime, 1440, css('.site-header { height: 90px !important }')],
    ['heading-size', runtime, 1440, css('h1 { font-size: 48px !important }')],
    ['single-title', runtime, 1440, dom("document.querySelector('main').append(document.createElement('h1'))")],
    ['metadata-face', runtime, 1440, css('.chapter-reference a { font-family: var(--font-mono) !important }')],
    ['version-text', runtime, 1440, dom("document.querySelector('.version-context bdi').textContent = '1. 6. 1'")],
    ['version-scope', runtime, 1440, dom("document.querySelector('.version-context').remove()")],
    ['limits-label', runtime, 1440, dom("document.querySelector('.limits p').prepend('Предел. ')")],
    ['reflow', runtime, 390, css('body { min-width: 1000px !important }')],
    ['navigation-gaps', runtime, 1440, css('[data-site-nav] li:first-child { margin-right: 40px !important }')],
    ['navigation-type', runtime, 1440, css('[data-site-nav] a { font-size: 20px !important }')],
    ['navigation-targets', runtime, 1440, css('[data-site-nav] a { min-height: 0 !important; height: 24px !important }')],
    ['title-order', runtime, 1440, dom("const title = document.querySelector('.title-block'); title.append(title.querySelector('h1'))")],
    ['intro-source', runtime, 1440, dom("document.querySelector('.title-block .chapter-reference').remove()")],
    ['section-type', runtime, 1440, css('.doc-section h2 { font-size: 44px !important }')],
    ['lead-type', runtime, 390, css('.lead { font-size: 20px !important }')],
    ['body-type', runtime, 1440, css('.doc-section > p { font-family: var(--font-ui) !important }')],
    ['subsection-type', platform, 1440, dom("const h = document.createElement('h3'); h.textContent = 'Boundary'; h.style.fontSize = '28px'; document.querySelector('.doc-section').append(h)")],
    ['sections', runtime, 1440, css('.doc-section { border-top: 0 !important }')],
    ['index-name', runtime, 1440, dom("document.querySelector('.section-index').removeAttribute('aria-label')")],
    ['index-links', runtime, 1440, dom("document.querySelector('.section-index a').href = '#missing-section'")],
    ['index-presentation', runtime, 1440, css('.section-index > details { display: block !important }')],
    ['index-presentation', runtime, 390, dom("document.querySelector('.section-index details').open = true")],
    ['index-column', runtime, 1440, css('.section-index { transform: translateX(-64px) !important }')],
    ['index-type', runtime, 1440, css('.section-index a { font-size: 16px !important }')],
    ['index-sticky', runtime, 1440, css('.section-index { position: static !important }')],
    ['runtime-fold', runtime, 1440, css('.title-block { padding-bottom: 1000px !important }')],
    ['index-scope', home, 1440, dom("const nav = document.createElement('nav'); nav.className = 'section-index'; document.querySelector('main').append(nav)")],
    ['layer-order', platform, 1440, dom("const list = document.querySelector('.layer-rows'); list.append(list.firstElementChild)")],
    ['layer-type', platform, 1440, css('.layer-rows p { font-family: var(--font-reading) !important }')],
    ['layer-grid', platform, 390, css('.layer-rows li { grid-template-columns: 7rem 1fr !important }')],
    ['platform-fold', platform, 1440, css('.layer-rows { margin-top: 1000px !important }')],
    ['home-order', home, 390, dom("const title = document.querySelector('.title-block'); title.append(title.querySelector('.category'))")],
    ['category-type', home, 390, css('.category { font-size: 16px !important }')],
    ['home-section-type', home, 1440, css('.home-band h2 { font-size: 32px !important }')],
    ['home-bands', home, 1440, css('.home-band { background: var(--color-bg) !important }')],
    ['primary-action', home, 390, dom("document.querySelector('.primary-action').setAttribute('role', 'button')")],
    ['primary-type', home, 390, css('.primary-action { font-weight: 400 !important }')],
    ['home-fold', home, 390, css('.home-actions { margin-top: 1000px !important }')],
    ['principle-rows', principles, 1440, dom("document.querySelector('.layer-rows--principle > div').remove()")],
    ['principle-type', principles, 1440, css('.layer-rows--principle dt { font-family: var(--font-reading) !important }')],
    ['principle-grid', principles, 1440, css('.layer-rows--principle > div { grid-template-columns: 1fr !important }')],
  ];
  try {
    const page = await site.browser.newPage({ reducedMotion: 'reduce' });
    for (const [code, route, width, plant] of cases) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(site.origin + route);
      assert.deepEqual((await visualContract(page)).errors, [], `positive: ${route} ${code}`);
      if (plant.css) await page.addStyleTag({ content: plant.css });
      else await page.evaluate(value => { new Function(value)(); }, plant.dom);
      assert.ok((await visualContract(page)).errors.includes(code), `undetected: ${code}`);
      await page.reload();
      assert.deepEqual((await visualContract(page)).errors, [], `restoration: ${code}`);
      evidence.push({ code, route, width, intendedViolationDetected: true, restored: true });
    }
    // Doubled text must retain page reflow; a forced nonwrapping footer reproduces the regression.
    for (const route of ['/ru/', '/en/', '/ru/book/', '/en/book/', runtime, '/en/platform/runtime/']) {
      for (const width of [390, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 }); await page.goto(site.origin + route);
        await page.evaluate(() => document.documentElement.style.fontSize = '200%');
        await page.waitForTimeout(30);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `text reflow ${route} ${width}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 900 }); await page.goto(site.origin + home);
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    const brokenFooter = await page.addStyleTag({ content: '.site-footer nav ul { flex-wrap: nowrap !important } .footer-inner > * { min-width: auto !important }' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), 'text reflow control must overflow');
    await brokenFooter.evaluate(element => element.remove());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    // At the exact breakpoint only the desktop presentation renders; mobile defaults to native closed details.
    for (const width of [639, 640, 768, 1023, 1024]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(site.origin + runtime);
      assert.deepEqual((await visualContract(page)).errors, [], `breakpoint ${width}`);
    }
  } finally {
    await mkdir(join(repository, '.temp/visual'), { recursive: true });
    await writeFile(join(repository, '.temp/visual/controls.json'), JSON.stringify(evidence, null, 2) + '\n');
    await site.close();
  }
});
