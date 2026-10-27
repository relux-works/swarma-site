import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, extname, sep, relative } from 'node:path';
import { openBrowser } from './publication/browser.mjs';
import { checkHeaderCentre, headerGeometry } from './header-geometry.mjs';
import AxeBuilder from '@axe-core/playwright';
import { filesAt } from './lib.mjs';
import { installDiagnostics } from '../../src/lib/diagnostics.mjs';
installDiagnostics();

const root = process.cwd(), output = join(root, '.temp/a11y');
await mkdir(output, { recursive: true });
const control = process.argv.includes('--control');
const geometryControl = process.argv.includes('--geometry-control');
const geometry = process.argv.includes('--geometry') || geometryControl;
const matrix = process.argv.includes('--matrix');
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let path;
    if (control && pathname === '/control/') path = join(root, 'scripts/checks/tests/fixtures/a11y-bad.html');
    else {
      path = resolve(root, 'dist', `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
      if (!path.startsWith(join(root, 'dist') + sep)) throw new Error('Invalid path');
    }
    const content = await readFile(path);
    const type = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }[extname(path)] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type }); response.end(content);
  } catch { response.writeHead(404); response.end('Not found'); }
});
let browser, browserSession;
const reports = [];
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browserSession = await openBrowser(root); browser = browserSession.browser;
  const requestedRoute = process.argv.find(arg => arg.startsWith('--route='))?.slice('--route='.length);
  let routes = control ? ['/control/'] : (await filesAt(root, 'dist')).filter(file => file.endsWith('.html')).map(file => '/' + relative(join(root, 'dist'), file).replace(/index\.html$/, ''));
  if (requestedRoute) routes = routes.filter(route => requestedRoute.split(',').includes(route));
  if (!routes.length) throw new Error('a11y: no built routes');
  async function scan(page, route, width, theme, state) {
    const result = await new AxeBuilder({ page }).analyze();
    const violations = result.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(node => node.target) }));
    reports.push({ route, width, theme, state, violations });
    if (violations.length) console.error(`a11y: ${route} ${width} ${theme} ${state}: ${violations.map(violation => violation.id).join(', ')}`);
  }
  const appearances = matrix ? [
    { name: 'light', colorScheme: 'light' }, { name: 'dark', colorScheme: 'dark' },
    { name: 'light-contrast', colorScheme: 'light', contrast: 'more' }, { name: 'dark-contrast', colorScheme: 'dark', contrast: 'more' },
    { name: 'forced-colors', colorScheme: 'light', forcedColors: 'active' },
    { name: 'reduced-transparency', colorScheme: 'light', transparency: true },
  ] : (control ? ['light'] : ['light', 'dark']).map(name => ({ name, colorScheme: name }));
  if (geometry) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 900 }, reducedMotion: 'reduce' });
    const selected = ['ru', 'en'].flatMap(lang => { const route = routes.find(route => route === `/${lang}/platform/`) ?? routes.find(route => route === `/${lang}/`); return route ? [route] : []; });
    if (!selected.length) throw new Error('header-geometry: no locale route');
    const observations = [];
    for (const route of selected) observations.push(await headerGeometry(page, origin, route, geometryControl));
    await writeFile(join(output, 'geometry.json'), JSON.stringify(observations, null, 2) + '\n');
    console.log(`header-geometry: ${observations.reduce((n, value) => n + value.observations, 0)} observations, 0 overlaps`);
    await page.close();
  }
  for (const width of geometry ? [] : control ? [390] : matrix ? [390, 768, 1440, 1920] : [390, 1440]) for (const appearance of appearances) {
    const theme = appearance.name;
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: appearance.colorScheme, contrast: appearance.contrast, forcedColors: appearance.forcedColors, reducedMotion: 'reduce' });
    const page = await context.newPage();
    if (appearance.transparency) {
      const session = await context.newCDPSession(page);
      await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
    }
    for (const route of routes) {
      await page.goto(origin + route); await page.evaluate(() => document.fonts.ready);
      await scan(page, route, width, theme, 'default');
      if (!control) {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) throw new Error(`a11y-geometry: ${route} ${width} overflow ${overflow}`);
        const titleCount = await page.locator('h1').count();
        if (titleCount !== 1) throw new Error(`a11y-heading: ${route} h1 count ${titleCount}`);
        if (await page.locator('[data-site-nav]').isVisible()) {
          await checkHeaderCentre(page, route);
        }
        if (await page.locator('.menu-trigger').isVisible()) {
          const trigger = page.locator('.menu-trigger');
          const before = await page.locator('.site-header .product-lockup').boundingBox();
          await trigger.click();
          await page.waitForFunction(() => { const dialog = document.querySelector('#site-menu'); return dialog.open && getComputedStyle(dialog).opacity === '1'; });
          const after = await page.locator('.site-header .product-lockup').boundingBox();
          if (Math.abs(before.x - after.x) > 1) throw new Error(`a11y-menu: ${route} scroll lock shifted page`);
          await scan(page, route, width, theme, 'menu-open');
          await page.locator('.menu-close').focus();
          await page.keyboard.press('Shift+Tab');
          if (!await page.locator('#site-menu').evaluate(node => node.contains(document.activeElement))) throw new Error(`a11y-menu: ${route} focus containment`);
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelector('.menu-trigger') === document.activeElement && document.querySelector('.menu-trigger').getAttribute('aria-expanded') === 'false' && !document.querySelector('#site-menu').open);
          await page.waitForFunction(() => getComputedStyle(document.querySelector('#site-menu')).display === 'none');
          if (!await trigger.evaluate(node => document.activeElement === node) || await trigger.getAttribute('aria-expanded') !== 'false') throw new Error(`a11y-menu: ${route} focus return`);
        }
        if (['/ru/', '/ru/platform/', '/ru/book/'].includes(route)) await page.screenshot({ path: join(output, `${route.replaceAll('/', '_')}-${width}-${theme}.png`), fullPage: false });
      }
    }
    await context.close();
  }
  await writeFile(join(output, geometry ? 'geometry-run.json' : control ? 'control.json' : matrix ? 'matrix.json' : 'report.json'), JSON.stringify({ browser: browser.version(), control, scans: reports }, null, 2) + '\n');
  if (control && !reports.some(report => report.violations.some(violation => violation.id === 'image-alt'))) throw new Error('a11y-control: expected image-alt was not detected');
  if (reports.some(report => report.violations.length)) process.exitCode = 1;
  if (!geometry) console.log(`a11y: ${reports.length} scans, ${reports.reduce((sum, report) => sum + report.violations.length, 0)} violations`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await writeFile(join(output, geometry ? 'geometry-run.json' : control ? 'control.json' : matrix ? 'matrix.json' : 'report.json'), JSON.stringify({ browser: browser?.version(), platform: process.platform, architecture: process.arch, control, scans: reports }, null, 2) + '\n'); if (browserSession) await browserSession.close(); await new Promise(resolve => server.close(resolve)); }
