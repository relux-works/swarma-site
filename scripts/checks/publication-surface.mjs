import { relative, join } from 'node:path';
import { parse } from 'parse5';
import { cli, filesAt } from './lib.mjs';
import { readPublication } from './publication-reader.mjs';
import { failure } from './scanner-policy.mjs';
import { publicationHTML, publicationFileType, publicationReader } from './publication-values.mjs';

const deniedTags = new Set(['form', 'input', 'textarea', 'select', 'iframe', 'object', 'embed', 'noscript', 'template']);
const rules = new Set([...deniedTags].map(tag => `publication-${tag}`).concat([
  'publication-button-value', 'publication-event-handler', 'publication-javascript-url',
  'publication-data-url', 'publication-meta-refresh',
]));

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
  if (!config || Object.keys(config).join() !== 'allow' || !Array.isArray(config.allow)) throw failure('publication-config');
  const seen = new Set();
  for (const entry of config.allow) {
    if (!entry || Object.keys(entry).sort().join() !== 'path,reason,rule'
      || typeof entry.path !== 'string' || !/^(?:src|public|dist)\//.test(entry.path)
      || entry.path.split('/').some(part => !part || part === '.' || part === '..' || /[\\*?]/.test(part))
      || !rules.has(entry.rule) || typeof entry.reason !== 'string' || !entry.reason.trim()) throw failure('publication-config');
    const key = `${entry.path}:${entry.rule}`;
    if (seen.has(key)) throw failure('publication-config');
    seen.add(key);
  }
  return seen;
}

export async function check(root) {
  const files = [
    ...await filesAt(root, 'src'),
    ...await filesAt(root, 'public'),
    ...await filesAt(root, 'dist'),
  ];
  // Classify every published path before reading any publication bytes or applying content allowances.
  const published = path => /^(?:public|dist)\//u.test(path);
  const unsupported = files.map(file => relative(root, file)).filter(path => published(path) && !publicationFileType(path));
  if (unsupported.length) return unsupported.map(path => `${path}: publication-file-type`);
  let allowed;
  try { allowed = allowances(JSON.parse((await readPublication(join(root, 'config/publication-surface.json'))).text)); }
  catch { throw failure('publication-config'); }
  const errors = [];
  const reader = await publicationReader(root);
  try {
    for (const file of files) {
      const path = relative(root, file);
      let publication;
      try { publication = await readPublication(file); }
      catch (error) { if (error.rule) { errors.push(`${path}: ${error.rule}`); continue; } throw error; }
      if (publication.binary) continue;
      let source = publication.text;
      // CommonMark is rendered by its library; raw template preflight is supplemented by compiled dist.
      if (/\.(?:astro|md|mdx)$/.test(path)) source = publicationHTML(path, source);
      const rejected = surfaceRules(source).filter(rule => !allowed.has(`${path}:${rule}`));
      for (const rule of rejected) errors.push(`${path}: ${rule}`);
      // Supported output must also decode through its real consumer, including JSON manifests and standalone SVG.
      if (published(path) && !rejected.length) {
        try { await reader.values(path, publication.text); }
        catch { errors.push(`${path}: publication-decode`); }
      }
    }
  } finally { await reader.close(); }
  return errors;
}
await cli(import.meta.url, check);
