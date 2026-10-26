import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { document, filesAt } from './lib.mjs';
import { installDiagnostics, redact } from '../../src/lib/diagnostics.mjs';

// Chromium resolves all 16 appearances; the upstream contract supplies pairs and WCAG alpha/luminance arithmetic.
export async function check(root, { control = false, cssOverride } = {}) {
  const output = join(root, '.temp/contrast');
  await mkdir(join(output, 'browser-tmp'), { recursive: true });
  const contractResult = spawnSync('python3', ['-B', 'scripts/check_computed_contrast.py', '--contract'], { cwd: root, encoding: 'utf8' });
  if (contractResult.status !== 0) throw new Error('contrast-browser: contract unavailable');
  const contract = JSON.parse(contractResult.stdout);
  const browser = await chromium.launch({ channel: 'chrome', headless: true, env: { ...process.env, TMPDIR: join(output, 'browser-tmp') } });
  const evidence = [];
  try {
    const files = (await filesAt(root, 'dist')).filter(file => file.endsWith('.html'));
    if (!files.length && !cssOverride) throw new Error('contrast: no built document');
    const sheets = new Map();
    for (const file of files) {
      const css = [];
      async function visit(node) {
        const attrs = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
        if (node.tagName === 'link' && attrs.rel === 'stylesheet') {
          if (!attrs.href.startsWith('/')) throw new Error('contrast: external stylesheet');
          css.push(await readFile(resolve(root, 'dist', '.' + attrs.href), 'utf8'));
        }
        if (node.tagName === 'style') css.push((node.childNodes ?? []).map(child => child.value ?? '').join(''));
        for (const child of node.childNodes ?? []) await visit(child);
      }
      await visit(document(await readFile(file, 'utf8')));
      const stylesheet = css.join('\n');
      if (!stylesheet.trim()) throw new Error('contrast: empty stylesheet');
      sheets.set(stylesheet, file);
    }
    if (cssOverride) { sheets.clear(); sheets.set(cssOverride, 'fixture'); }
    let total = 0;
    for (const [css, file] of sheets) {
      const palettes = {}, systems = {}, measuredPairs = {};
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.route('**/*', route => route.abort());
        await page.setContent('<html><head></head><body></body></html>');
        await page.addStyleTag({ content: css });
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
            document.body.replaceChildren();
            const fixtureStyle = document.createElement('style');
            if (control) fixtureStyle.textContent = ':root { --color-text-faint: #9aa1ab !important; }';
            document.body.append(fixtureStyle);
            const probe = document.createElement('span');
            // Observe the declared pair, without automatic substitution repairing a broken token contract.
            probe.style.forcedColorAdjust = 'none';
            document.body.append(probe);
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
              document.body.append(element);
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
      const result = spawnSync('python3', ['-B', 'scripts/check_computed_contrast.py'], { cwd: root, input: JSON.stringify({ palettes, systems, pairs: measuredPairs }), encoding: 'utf8' });
      if (result.error) throw new Error('contrast-browser: arithmetic unavailable');
      evidence.push({ file, browser: browser.version(), palettes, systems, pairs: measuredPairs, exit: result.status, output: result.stdout + result.stderr });
      if (result.status !== 0) throw new Error(redact(`contrast-cascade: ${result.stdout}${result.stderr}`));
      total += Object.keys(palettes).length * contract.pairs.length;
    }
    console.log(`contrast-cascade: ${total} pairs, ${sheets.size} effective stylesheet sets, 0 failures`);
    console.log(`pairs: ${total}, failures: 0, forced-color failures: 0`);
  } finally {
    await writeFile(join(output, 'report.json'), redact(JSON.stringify(evidence, null, 2)) + '\n');
    await browser.close();
  }
}
if (process.argv[1]?.endsWith('/contrast.mjs')) {
  installDiagnostics();
  try {
    const tokens = process.argv.find(arg => arg.startsWith('--tokens='))?.slice('--tokens='.length);
    await check(process.cwd(), { control: process.argv.includes('--control'), cssOverride: tokens ? await readFile(tokens, 'utf8') : undefined });
  } catch (error) { console.error(redact(error.message)); process.exitCode = 1; }
}
