import { readFile } from 'node:fs/promises';
import { relative, extname, join } from 'node:path';
import { parse } from 'parse5';
import { cli, filesAt } from './lib.mjs';

const deniedTags = new Set(['form', 'input', 'textarea', 'select', 'iframe', 'object', 'embed', 'noscript', 'template']);
const rules = new Set([...deniedTags].map(tag => `publication-${tag}`).concat([
  'publication-button-value', 'publication-event-handler', 'publication-javascript-url',
  'publication-data-url', 'publication-meta-refresh',
]));
const sourceExtensions = new Set(['.astro', '.html', '.htm', '.md', '.mdx', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts', '.vue', '.svelte', '.svg']);

export function surfaceRules(source) {
  const found = new Set();
  // Both HTML modes are inspected; forbidden containers are rejected before any text exemption.
  for (const scriptingEnabled of [true, false]) {
    function visit(node) {
      const attrs = new Map((node.attrs ?? []).map(attr => [attr.name, attr.value]));
      if (deniedTags.has(node.tagName)) found.add(`publication-${node.tagName}`);
      if (node.tagName === 'button' && attrs.has('value')) found.add('publication-button-value');
      if (node.tagName === 'meta' && attrs.get('http-equiv')?.trim().toLowerCase() === 'refresh') found.add('publication-meta-refresh');
      for (const attr of node.attrs ?? []) {
        if (/^on/i.test(attr.name)) found.add('publication-event-handler');
        // HTML parsing decodes entities once. URL parsing ignores ASCII whitespace/control characters.
        const value = attr.value.replace(/[\u0000-\u0020\u007f]/g, '');
        if (/javascript:/i.test(value)) found.add('publication-javascript-url');
        for (const match of value.matchAll(/data:([^,]*)/gi)) {
          if (!/^image\/[a-z0-9.+-]+(?:;|$)/i.test(match[1])) found.add('publication-data-url');
        }
      }
      for (const child of node.childNodes ?? []) visit(child);
      if (node.content) visit(node.content);
    }
    visit(parse(source, { scriptingEnabled }));
  }
  return [...found];
}

function allowances(config) {
  if (!config || Object.keys(config).join() !== 'allow' || !Array.isArray(config.allow)) throw new Error('publication-config: expected an allow list');
  const seen = new Set();
  for (const entry of config.allow) {
    if (!entry || Object.keys(entry).sort().join() !== 'path,reason,rule'
      || typeof entry.path !== 'string' || !/^(?:src|public|dist)\//.test(entry.path)
      || entry.path.split('/').some(part => !part || part === '.' || part === '..' || /[\\*?]/.test(part))
      || !rules.has(entry.rule) || typeof entry.reason !== 'string' || !entry.reason.trim()) throw new Error('publication-config: invalid allowance');
    const key = `${entry.path}:${entry.rule}`;
    if (seen.has(key)) throw new Error('publication-config: duplicate allowance');
    seen.add(key);
  }
  return seen;
}

export async function check(root) {
  const allowed = allowances(JSON.parse(await readFile(join(root, 'config/publication-surface.json'), 'utf8')));
  const files = [
    ...(await filesAt(root, 'src')).filter(file => sourceExtensions.has(extname(file))),
    ...await filesAt(root, 'public'),
    ...await filesAt(root, 'dist'),
  ];
  const errors = [];
  for (const file of files) {
    const path = relative(root, file);
    let source = await readFile(file, 'utf8');
    // Astro/Markdown frontmatter is not HTML. Generated markup is checked independently in dist.
    if (/\.(?:astro|md|mdx)$/.test(path)) source = source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
    for (const rule of surfaceRules(source)) if (!allowed.has(`${path}:${rule}`)) errors.push(`${path}: ${rule}`);
  }
  return errors;
}
await cli(import.meta.url, check);
