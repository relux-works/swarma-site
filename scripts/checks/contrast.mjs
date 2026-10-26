import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { openBrowser } from './publication/browser.mjs';
import { filesAt } from './lib.mjs';
import { installDiagnostics, redact } from '../../src/lib/diagnostics.mjs';

const arithmetic = fileURLToPath(new URL('../check_computed_contrast.py', import.meta.url));

// Chromium resolves all 16 appearances; the upstream contract supplies pairs and WCAG alpha/luminance arithmetic.
export async function check(root, { control = false, cssOverride } = {}) {
  const output = join(root, '.temp/contrast');
  await mkdir(output, { recursive: true });
  const contractResult = spawnSync('python3', ['-B', arithmetic, '--contract'], { cwd: root, encoding: 'utf8' });
  if (contractResult.status !== 0) throw new Error('contrast-browser: contract unavailable');
  const contract = JSON.parse(contractResult.stdout);
  const session = await openBrowser(root), browser = session.browser;
  const evidence = [];
  try {
    const files = (await filesAt(root, 'dist')).filter(file => file.endsWith('.html'));
    if (!files.length && !cssOverride) throw new Error('contrast: no built document');
    const documents = cssOverride ? ['fixture'] : files;
    let total = 0;
    for (const file of documents) {
      const palettes = {}, systems = {}, measuredPairs = {};
      const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
      try {
        const page = await context.newPage();
        const origin = 'http://contrast.invalid';
        let resourceFailed = false;
        await context.route('**/*', async route => {
          try {
            const url = new URL(route.request().url());
            if (url.origin !== origin) throw new Error();
            if (cssOverride && url.pathname === '/fixture.html') return await route.fulfill({
              contentType: 'text/html', body: '<!doctype html><html><head><link rel="stylesheet" href="/fixture.css"></head><body></body></html>',
            });
            if (cssOverride && url.pathname === '/fixture.css') return await route.fulfill({ contentType: 'text/css', body: cssOverride });
            const path = resolve(root, 'dist', '.' + decodeURIComponent(url.pathname));
            if (!path.startsWith(resolve(root, 'dist') + sep)) throw new Error();
            const contentType = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[extname(path)] ?? 'application/octet-stream';
            await route.fulfill({ contentType, body: await readFile(path) });
          } catch {
            resourceFailed = true;
            await route.abort();
          }
        });
        await page.emulateMedia({ media: 'screen' });
        const path = cssOverride ? '/fixture.html' : '/' + relative(join(root, 'dist'), file).split(sep).map(encodeURIComponent).join('/');
        await page.goto(origin + path, { waitUntil: 'load' });
        if (resourceFailed) throw new Error('contrast: local resource unavailable');
        if (!await page.evaluate(() => document.styleSheets.length > 0)) throw new Error('contrast: empty stylesheet');
        const session = await context.newCDPSession(page);
        for (const forced of [false, true]) for (const scheme of ['light', 'dark']) for (const more of [false, true]) for (const reduced of [false, true]) {
          const name = scheme + (more ? '-contrast' : '') + (reduced ? '/reduced' : '') + (forced ? '/forced' : '');
          const features = [
            { name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-contrast', value: more ? 'more' : 'no-preference' },
            { name: 'prefers-reduced-transparency', value: reduced ? 'reduce' : 'no-preference' }, { name: 'forced-colors', value: forced ? 'active' : 'none' },
          ];
          await session.send('Emulation.setEmulatedMedia', { media: 'screen', features });
          const result = await page.evaluate(({ features, roles, pairs, control }) => {
            if (!features.every(({ name, value }) => matchMedia(`(${name}: ${value})`).matches)) throw new Error('contrast: media emulation unavailable');
            document.querySelector('[data-contrast-probes]')?.remove();
            document.querySelector('[data-contrast-control]')?.remove();
            const probes = document.createElement('div');
            probes.dataset.contrastProbes = '';
            document.body.append(probes);
            const fixtureStyle = document.createElement('style');
            fixtureStyle.dataset.contrastControl = '';
            if (control) fixtureStyle.textContent = ':root { --color-text-faint: #9aa1ab !important; }';
            document.head.append(fixtureStyle);
            const probe = document.createElement('span');
            // Observe the declared pair, without automatic substitution repairing a broken token contract.
            probe.style.forcedColorAdjust = 'none';
            probes.append(probe);
            const tokens = {};
            for (const key of Object.keys(roles)) {
              const token = getComputedStyle(document.documentElement).getPropertyValue(`--color-${key}`).trim();
              if (!token || !CSS.supports('color', token)) throw new Error('contrast: missing semantic color');
              probe.style.color = `var(--color-${key})`;
              tokens[key] = getComputedStyle(probe).color;
            }
            const system = {};
            for (const role of new Set(Object.values(roles))) {
              probe.style.color = role;
              system[role] = getComputedStyle(probe).color;
            }
            const computedPairs = pairs.map(pair => {
              const element = document.createElement('span');
              element.style.cssText = 'forced-color-adjust:none;';
              element.style.color = `var(--color-${pair.fg})`;
              element.style.backgroundColor = `var(--color-${pair.bg})`;
              probes.append(element);
              const computed = getComputedStyle(element);
              return { foreground: computed.color, background: computed.backgroundColor };
            });
            return { tokens, system, computedPairs };
          }, { features, roles: contract.roles, pairs: contract.pairs, control: control && name === 'light' });
          palettes[name] = result.tokens;
          measuredPairs[name] = result.computedPairs;
          if (forced) systems[name] = result.system;
        }
        await session.detach();
      } finally { await context.close(); }
      const result = spawnSync('python3', ['-B', arithmetic], { cwd: root, input: JSON.stringify({ palettes, systems, pairs: measuredPairs }), encoding: 'utf8' });
      if (result.error) throw new Error('contrast-browser: arithmetic unavailable');
      evidence.push({ file, browser: browser.version(), palettes, systems, pairs: measuredPairs, exit: result.status, output: result.stdout + result.stderr });
      if (result.status !== 0) throw new Error(redact(`contrast-cascade: ${result.stdout}${result.stderr}`));
      total += Object.keys(palettes).length * contract.pairs.length;
    }
    console.log(`contrast-cascade: ${total} pairs, ${documents.length} screen documents, 0 failures`);
    console.log(`pairs: ${total}, failures: 0, forced-color failures: 0`);
  } finally {
    await writeFile(join(output, 'report.json'), redact(JSON.stringify(evidence, null, 2)) + '\n');
    await session.close();
  }
}
if (process.argv[1]?.endsWith('/contrast.mjs')) {
  installDiagnostics();
  try {
    const tokens = process.argv.find(arg => arg.startsWith('--tokens='))?.slice('--tokens='.length);
    await check(process.cwd(), { control: process.argv.includes('--control'), cssOverride: tokens ? await readFile(tokens, 'utf8') : undefined });
  } catch (error) { console.error(redact(error.message)); process.exitCode = 1; }
}
