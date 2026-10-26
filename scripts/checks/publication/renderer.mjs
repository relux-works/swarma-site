// Shared structural approach: CommonMark -> unchanged HTML/CSS -> Chromium DOM/AX/computed content.
// Kept as a site adapter because it loads caller-provided asset roots and accepts caller-validated DOM exclusions.
import { extname, join, dirname, resolve, sep } from 'node:path';
import MarkdownIt from 'markdown-it';
import matter from 'gray-matter';
import { chromium } from 'playwright';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { cssValues, decodePercent } from './css.mjs';
import { readPublication } from './reader.mjs';
import { failure } from './policy.mjs';

const markdown = new MarkdownIt('commonmark', { html: true });
const markupExtensions = new Set(['.html', '.htm', '.svg', '.astro', '.mdx', '.vue', '.svelte']);
export function* jsonStrings(value) {
  if (typeof value === 'string') yield value;
  else if (Array.isArray(value)) { for (const item of value) yield* jsonStrings(item); }
  else if (value && typeof value === 'object') { for (const [key, item] of Object.entries(value)) { yield key; yield* jsonStrings(item); } }
}
export function publicationHTML(path, text) {
  if (extname(path) === '.md') return markdown.render(matter(text).content);
  if (extname(path) === '.astro' || extname(path) === '.mdx') return text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u, '');
  return text;
}
const types = new Map([['.css', 'text/css'], ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.woff2', 'font/woff2']]);
export async function publicationReader(root, { assetRoots = [] } = {}) {
  let browser, context, page, cdp, current, scratch;
  const cache = new Map();
  async function ready() {
    if (browser) return;
    const temp = join(root, '.temp/publication-browser');
    await mkdir(temp, { recursive: true });
    scratch = await mkdtemp(join(temp, 'run-'));
    const previousTemp = process.env.TMPDIR;
    try {
      process.env.TMPDIR = scratch;
      browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, downloadsPath: scratch, tracesDir: scratch, env: { ...process.env, TMPDIR: scratch } });
    } finally { if (previousTemp === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = previousTemp; }
    context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    await context.route('**/*', async route => {
      try {
        const url = new URL(route.request().url());
        if (url.origin !== 'http://publication.invalid') return await route.abort();
        if (url.pathname === current.urlPath) return await route.fulfill({ contentType: 'text/html; charset=utf-8', body: current.html });
        const local = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        let found;
        for (const base of [dirname(join(root, current.path)), ...assetRoots.map(path => join(root, path)), root]) {
          const file = resolve(base, local);
          if (!file.startsWith(resolve(root) + sep)) continue;
          try { found = await readPublication(file); break; } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error; }
        }
        if (!found) return await route.abort();
        await route.fulfill({ body: found.bytes, contentType: `${types.get(extname(local)) ?? 'application/octet-stream'}; charset=utf-8` });
      } catch { current.failed = true; await route.abort().catch(() => {}); }
    });
    page = await context.newPage();
    cdp = await context.newCDPSession(page);
  }
  async function render(path, html, excluded = []) {
    await ready();
    current = { path, html, failed: false, urlPath: '/' + path.replace(/^(?:dist|public)\//u, '').split('/').map(encodeURIComponent).join('/') };
    await page.goto('http://publication.invalid' + current.urlPath, { waitUntil: 'load', timeout: 10000 });
    const styled = await page.evaluate(() => document.styleSheets.length > 0 || Boolean(document.querySelector('[style]')));
    let observed = false;
    const values = [], prose = [], accessible = [], styles = [], json = [];
    for (const width of [390, 1440]) for (const appearance of [
      { colorScheme: 'light', contrast: 'no-preference', forcedColors: 'none' },
      { colorScheme: 'dark', contrast: 'no-preference', forcedColors: 'none' },
      { colorScheme: 'light', contrast: 'more', forcedColors: 'none' },
      { colorScheme: 'light', contrast: 'no-preference', forcedColors: 'active' },
    ]) {
      if (observed && !styled) continue;
      observed = true;
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia(appearance);
      const data = await page.evaluate(excluded => {
        const all = [...document.querySelectorAll('*')];
        const attrs = [], urls = [], labels = [], css = [], generated = [], json = [];
        for (const element of all) {
          for (const attr of element.attributes) {
            attrs.push(attr.value);
            if (['href', 'src', 'srcset', 'action', 'poster'].includes(attr.name)) urls.push(attr.value);
            if (['alt', 'aria-label', 'aria-description', 'title', 'content'].includes(attr.name)) labels.push(attr.value);
            if (attr.name === 'style') css.push(['declarationList', attr.value]);
          }
          if (element.localName === 'style') css.push(['stylesheet', element.textContent]);
          if (element.localName === 'script' && ['application/json', 'application/ld+json'].includes(element.getAttribute('type'))) json.push(element.textContent);
          for (const pseudo of ['::before', '::after']) {
            const style = getComputedStyle(element, pseudo);
            if (getComputedStyle(element).display !== 'none' && style.display !== 'none' && style.content && !['none', 'normal'].includes(style.content)) generated.push(style.content);
          }
          if (['svg', 'title', 'desc', 'text'].includes(element.localName)) labels.push(element.textContent);
        }
        const text = document.body?.innerText ?? document.documentElement.innerText;
        const saved = excluded.map(index => all[index]).filter(Boolean).map(node => [node, node.style.cssText]);
        for (const [node] of saved) node.style.setProperty('display', 'none', 'important');
        const prose = document.body?.innerText ?? document.documentElement.innerText;
        for (const [node, style] of saved) node.style.cssText = style;
        return { text, prose, attrs, urls, labels, css, generated, json };
      }, excluded);
      values.push(data.text, ...data.attrs, ...data.urls.map(decodePercent));
      prose.push(data.prose);
      accessible.push(...data.labels);
      styles.push(...data.css);
      for (const value of data.generated) { const decoded = cssValues(value, 'value'); values.push(...decoded); prose.push(...decoded); }
      json.push(...data.json);
      // Read accessible names with validated regions hidden; unrelated referenced labels remain checked.
      await page.evaluate(excluded => {
        const all = [...document.querySelectorAll('*')];
        window.__scannerSaved = excluded.map(index => all[index]).filter(Boolean).map(node => [node, node.style.cssText]);
        for (const [node] of window.__scannerSaved) node.style.setProperty('display', 'none', 'important');
      }, excluded);
      const ax = await cdp.send('Accessibility.getFullAXTree');
      const names = ax.nodes.filter(node => !node.ignored).flatMap(node => [node.name?.value, node.description?.value]).filter(value => typeof value === 'string');
      values.push(...names);
      // Caller-validated regions affect prose only; their decoded attributes remain checked.
      accessible.push(...names);
      await page.evaluate(() => { for (const [node, style] of window.__scannerSaved) node.style.cssText = style; delete window.__scannerSaved; });
    }
    if (current.failed) throw failure('publication-decode');
    for (const [context, source] of styles) values.push(...cssValues(source, context));
    for (const source of json) values.push(...jsonStrings(JSON.parse(source)));
    return { values: [...new Set(values)], prose: [...new Set([...prose, ...accessible])], accessible };
  }
  return {
    async values(path, text, { excluded = [] } = {}) {
      const key = `${path}\0${text}\0${excluded.join(',')}`;
      if (cache.has(key)) return cache.get(key);
      const suffix = extname(path).toLowerCase();
      let result;
      if (suffix === '.json') result = { values: [...jsonStrings(JSON.parse(text))], prose: [], accessible: [] };
      else if (suffix === '.css') result = { values: cssValues(text), prose: [], accessible: [] };
      else if (suffix === '.md' || markupExtensions.has(suffix) || /^\s*</u.test(text)) {
        if (suffix === '.svg' && /<!DOCTYPE|<!ENTITY/iu.test(text)) throw failure('publication-decode');
        result = await render(path, publicationHTML(path, text), excluded);
        if (suffix === '.md') result.values.push(...jsonStrings(matter(text).data));
      } else result = { values: [], prose: [text], accessible: [] };
      cache.set(key, result);
      return result;
    },
    async close() { try { await context?.close(); } finally { try { await browser?.close(); } finally { if (scratch) await rm(scratch, { recursive: true, force: true }); } } },
  };
}
