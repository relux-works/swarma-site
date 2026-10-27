import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, sep, relative, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { filesAt } from './lib.mjs';
import { openBrowser } from './publication/browser.mjs';
import { installDiagnostics } from '../../src/lib/diagnostics.mjs';

export async function builtSite(root) {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const path = resolve(root, 'dist', `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
      if (!path.startsWith(join(root, 'dist') + sep)) throw new Error('Invalid path');
      const content = await readFile(path);
      response.setHeader('Content-Type', { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[extname(path)] ?? 'application/octet-stream');
      response.end(content);
    } catch { response.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const session = await openBrowser(root);
    return { browser: session.browser, origin: `http://127.0.0.1:${server.address().port}`, async close() { try { await session.close(); } finally { await new Promise(resolve => server.close(resolve)); } } };
  } catch (error) { await new Promise(resolve => server.close(resolve)); throw error; }
}

// Measurements use the rendered fonts and boxes. Locale metadata values are outside this layout contract.
export async function visualContract(page) {
  await page.evaluate(() => { scrollTo(0, 0); return document.fonts.ready; });
  const report = await page.evaluate(() => {
    const errors = [], values = {};
    const check = (code, pass, value) => { if (!pass) errors.push(code); if (value !== undefined) values[code] = value; };
    const all = selector => [...document.querySelectorAll(selector)];
    const one = selector => document.querySelector(selector);
    const visible = selector => all(selector).filter(element => element.getClientRects().length > 0);
    const box = element => element?.getBoundingClientRect();
    const style = element => getComputedStyle(element);
    const near = (a, b) => Math.abs(a - b) <= .2;
    const number = (element, property) => parseFloat(style(element)[property]);
    const type = (selector, size, family, weight, leading) => all(selector).every(element => near(number(element, 'fontSize'), size) && style(element).fontFamily.startsWith(`"${family}"`) && (!weight || Number(style(element).fontWeight) === weight) && (!leading || near(number(element, 'lineHeight'), size * leading)));
    const width = innerWidth, mobile = width < 640, desktop = width >= 1024;
    const home = !!one('.home-page'), docs = !!one('.page-grid');
    const title = one('.title-block'), index = one('.section-index');
    const indexExpected = all('.doc-section').length >= 2;
    check('header-height', near(box(one('.site-header')).height, 68), box(one('.site-header')).height);
    check('heading-size', type('h1', home ? mobile ? 44 : 72 : mobile ? 40 : 56, 'PT Sans', 700, home ? 1.06 : 1.1));
    check('single-title', all('h1').length === 1);
    check('metadata-face', all('.version-context, .version-context *, .chapter-reference, .chapter-reference *, .publication-value').every(element => style(element).fontFamily.startsWith('"PT Sans"') && near(number(element, 'fontSize'), 13)));
    check('version-text', all('.version-context bdi').every(element => element.textContent === '1.6.1'));
    check('version-scope', docs ? all('.version-context').length === 1 && title?.lastElementChild.matches('.version-context') : !one('.version-context'));
    check('limits-label', all('.limits').every(element => !/^(Предел\.|Limit\.)/.test(element.querySelector('p')?.textContent.trim() ?? '')));
    check('reflow', document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    const nav = one('[data-site-nav]');
    if (style(nav).visibility === 'visible') {
      const labels = all('[data-site-nav] a').map(element => { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect(); });
      const gaps = labels.slice(1).map((label, i) => label.left - labels[i].right);
      check('navigation-gaps', !gaps.length || Math.max(...gaps) - Math.min(...gaps) <= 2, gaps);
    }
    check('navigation-type', type('.site-header nav:not(.language-switch) a, .site-footer nav:not(.language-switch) a', 16, 'PT Sans', 400, 1.45));
    check('navigation-targets', all('.site-header nav a, .site-footer nav a').filter(element => box(element).width && box(element).height && style(element.closest('nav')).visibility === 'visible').every(element => box(element).width >= 44 && box(element).height >= 44));
    if (title) {
      check('title-order', title.firstElementChild?.matches('h1') && (!docs || !indexExpected || index?.previousElementSibling === title && index?.nextElementSibling?.matches('.page-body')));
      if (docs || home) check('intro-source', !!title.querySelector('.chapter-reference'));
    }
    if (docs) {
      check('section-type', type('.doc-section > h2', 32, 'PT Sans', 700, 1.16));
      check('lead-type', type('.title-block > .lead', mobile ? 18 : 20, 'PT Serif', 400, 1.6));
      check('body-type', type('.doc-section > p:not(.chapter-reference)', 16, 'PT Serif', 400, 1.65));
      check('subsection-type', type('.doc-section > h3', mobile ? 18 : 20, 'PT Sans', 700, 1.38));
      check('sections', all('.page-body > h2').length === 0 && all('.doc-section').every(element => element.getAttribute('aria-labelledby') === element.querySelector('h2')?.id && near(number(element, 'borderTopWidth'), 1) && near(number(element, 'paddingTop'), mobile ? 32 : 48) && near(number(element, 'marginTop'), mobile ? 32 : 48)));
      if (indexExpected) {
      check('index-name', !!index?.getAttribute('aria-label'));
      check('index-links', (desktop ? visible('.section-index a') : all('.section-index details a')).length === all('.doc-section > h2').length && (desktop ? visible('.section-index a') : all('.section-index details a')).every((element, i) => element.getAttribute('href') === '#' + all('.doc-section > h2')[i].id && (box(element).height >= 44 || !desktop && !index.querySelector('details').open)));
      check('index-presentation', desktop ? visible('.section-index details, .section-index summary').length === 0 && visible('.index-column > p').length === 1 : !!index.querySelector('details:not([open]) > summary') && visible('.index-column').length === 0);
      if (desktop) {
        check('index-column', near(box(index).left - box(title).left, box(title).width + 64) && (width !== 1440 || box(index).left - box(title).left >= 784 - .2) && near(box(index).width, 240), { offset: box(index).left - box(title).left, width: box(index).width });
        check('index-type', type('.section-index a', 13, 'PT Sans', 400, 1.45));
        if (location.pathname.endsWith('/platform/runtime/')) check('runtime-fold', box(one('.doc-section h2')).top < 900, box(one('.doc-section h2')).top);
      }
      } else check('index-scope', !index);
    } else check('index-scope', !index);
    const rows = all('.title-block .layer-rows > li');
    if (home || /\/(ru|en)\/platform\/$/.test(location.pathname)) {
      check('layer-order', rows.length === 3 && rows.every((row, i) => row.querySelector('a').textContent === ['Swarma Runtime', 'Swarma Protocol', 'Swarma Chain'][i] && row.querySelector('.layer-number').textContent.endsWith(String(2 - i))));
      check('layer-type', type('.layer-rows a', 20, 'PT Sans', 700, 1.38) && type('.layer-rows p', 16, 'PT Sans', 400, 1.55) && type('.layer-number', 12, 'PT Mono', 400, 1.45));
      check('layer-grid', rows.every(row => style(row).gridTemplateColumns.split(' ').length === (mobile ? 1 : 2) && near(number(row, 'paddingTop'), 16) && near(number(row, 'paddingBottom'), 16) && near(number(row, 'borderTopWidth'), 1)));
      if (desktop && !home) check('platform-fold', box(rows.at(-1)).bottom < 900, box(rows.at(-1)).bottom);
    }
    if (home) {
      const action = one('.primary-action');
      check('home-order', [...title.children].map(element => element.className || element.tagName).join('|') === 'home-title|category|layer-rows|home-actions|chapter-reference');
      check('category-type', type('.category', 20, 'PT Sans', 400, 1.5));
      check('home-section-type', type('.home-band h2', mobile ? 32 : 44, 'PT Sans', 700, 1.16));
      check('home-bands', all('.home-band').length > 1 && all('.home-band').every((element, i, elements) => near(box(element).width, document.documentElement.clientWidth) && near(number(element, 'paddingTop'), mobile ? 64 : 96) && (!i || style(element).backgroundColor !== style(elements[i - 1]).backgroundColor)));
      check('primary-action', all('.primary-action').length === 1 && action?.tagName === 'A' && !action.hasAttribute('role') && action.getAttribute('href') === `/${document.documentElement.lang}/book/` && box(action).height >= 44);
      check('primary-type', type('.primary-action', 16, 'PT Sans', 700));
      if (width === 390) check('home-fold', box(action).bottom <= innerHeight, box(action).bottom);
    }
    if (location.pathname.endsWith('/principles/')) {
      const groups = all('dl.layer-rows--principle');
      check('principle-rows', groups.length === 7 && groups.every(group => group.children.length === 3 && [...group.children].every((row, i) => row.querySelector('dt')?.textContent === ['Swarma Runtime', 'Swarma Protocol', 'Swarma Chain'][i] && !!row.querySelector('dd'))));
      check('principle-type', type('.layer-rows--principle dt', 16, 'PT Sans', 700) && type('.layer-rows--principle dd', 16, 'PT Serif', 400));
      check('principle-grid', all('.layer-rows--principle > div').every(row => style(row).gridTemplateColumns.split(' ').length === (mobile ? 1 : 2) && near(number(row, 'paddingTop'), 16) && near(number(row, 'borderTopWidth'), 1)));
    }
    return { errors, values, docs: docs && indexExpected, desktop };
  });
  if (report.docs && report.desktop) {
    const sticky = await page.evaluate(() => {
      scrollTo(0, 600);
      const index = document.querySelector('.section-index');
      return getComputedStyle(index).position === 'sticky' && Math.abs(index.getBoundingClientRect().top - 32) < 1;
    });
    if (!sticky) report.errors.push('index-sticky');
    await page.evaluate(() => scrollTo(0, 0));
  }
  return report;
}

// Include the locale selector, the 404 page and every content route; reject missing or extra HTML.
export async function builtRoutes(root) {
  const routes = (await filesAt(root, 'dist')).filter(path => path.endsWith('.html')).map(path => '/' + relative(join(root, 'dist'), path).replace(/index\.html$/, '')).sort();
  const content = (await filesAt(root, 'src/content/pages')).filter(path => path.endsWith('.md')).map(path => '/' + relative(join(root, 'src/content/pages'), path).replace(/index\.md$/, '').replace(/\.md$/, '/'));
  const expected = ['/', '/404.html', ...content].sort();
  const missing = expected.filter(route => !routes.includes(route));
  const extra = routes.filter(route => !expected.includes(route));
  if (missing.length || extra.length) throw new Error(`visual-contract: route inventory: missing ${missing.join(', ') || 'none'}; extra ${extra.join(', ') || 'none'}`);
  return routes;
}

export async function checkVisual(root = process.cwd()) {
  const site = await builtSite(root), observations = [];
  try {
    const routes = await builtRoutes(root);
    for (const width of [390, 1440]) for (const colorScheme of ['light', 'dark']) {
      const page = await site.browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme, reducedMotion: 'reduce' });
      for (const route of routes) {
        await page.goto(site.origin + route);
        const observation = { route, width, colorScheme, ...await visualContract(page) };
        observations.push(observation);
        if (observation.errors.length) throw new Error(`visual-contract: ${route} ${width} ${colorScheme}: ${observation.errors.join(', ')}`);
      }
      await page.close();
    }
  } finally {
    await mkdir(join(root, '.temp/visual'), { recursive: true });
    await writeFile(join(root, '.temp/visual/report.json'), JSON.stringify(observations, null, 2) + '\n');
    await site.close();
  }
  console.log(`visual-contract: ${observations.length} route appearances, 0 violations`);
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  installDiagnostics();
  try { await checkVisual(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
