import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { document, filesAt } from './lib.mjs';

// Chromium supplies the effective cascade; the unchanged design-system checker supplies pairs and WCAG arithmetic.
export async function check(root, { control = false, cssOverride } = {}) {
  const output = join(root, '.temp/contrast');
  await mkdir(join(output, 'browser-tmp'), { recursive: true });
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
      const palettes = {};
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.route('**/*', route => route.abort());
      await page.setContent('<html><head></head><body></body></html>');
      await page.addStyleTag({ content: css });
      for (const scheme of ['light', 'dark']) for (const more of [false, true]) for (const reduced of [false, true]) {
        const name = scheme + (more ? '-contrast' : '') + (reduced ? '/reduced' : '');
        const session = await context.newCDPSession(page);
        await session.send('Emulation.setEmulatedMedia', { features: [
          { name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-contrast', value: more ? 'more' : 'no-preference' },
          { name: 'prefers-reduced-transparency', value: reduced ? 'reduce' : 'no-preference' }, { name: 'forced-colors', value: 'none' },
        ] });
        palettes[name] = await page.evaluate(() => {
          const style = getComputedStyle(document.documentElement), result = {};
          const probe = document.createElement('span'); document.body.append(probe);
          for (const key of Array.from(style).filter(key => key.startsWith('--color-'))) {
            probe.style.color = `var(${key})`;
            const color = getComputedStyle(probe).color;
            const match = /^rgba?\(([^)]+)\)$/.exec(color);
            if (!match) throw new Error('contrast: unsupported computed color');
            const values = match[1].split(',').map(Number);
            result[key.slice(8)] = values.length === 4 ? `rgba(${values.join(',')})` : '#' + values.map(value => value.toString(16).padStart(2, '0')).join('');
          }
          probe.remove(); return result;
        });
        await session.detach();
      }
      if (control) palettes.light['role-human-text'] = palettes.light['role-human-fill'];
      await context.close();
      const result = spawnSync('python3', ['-B', 'scripts/check_computed_contrast.py'], { cwd: root, input: JSON.stringify(palettes), encoding: 'utf8' });
      if (result.error) throw result.error;
      evidence.push({ file, palettes, exit: result.status, output: result.stdout + result.stderr });
      if (result.status !== 0) throw new Error(`contrast-cascade: ${result.stdout}${result.stderr}`);
      total += 1408;
    }
    console.log(`contrast-cascade: ${total} pairs, ${sheets.size} effective stylesheet sets, 0 failures`);
  } finally {
    await writeFile(join(output, 'report.json'), JSON.stringify(evidence, null, 2) + '\n');
    await browser.close();
  }
}
if (process.argv[1]?.endsWith('/contrast.mjs')) {
  try { await check(process.cwd(), { control: process.argv.includes('--control') }); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
