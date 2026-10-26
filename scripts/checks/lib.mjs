import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { denyTokens, redactor, safeError } from './scanner-policy.mjs';
import { approvedFont } from './font-approved.mjs';

export async function filesAt(root, path) {
  const absolute = join(root, path);
  try {
    const info = await stat(absolute);
    if (info.isFile()) return [absolute];
    return (await Promise.all((await readdir(absolute)).sort().map(name => filesAt(root, join(path, name))))).flat();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function scanFiles(root) {
  const files = (await Promise.all(['src', 'public', 'docs', 'README.md', 'dist', 'scripts', 'config'].map(path => filesAt(root, path)))).flat();
  return files.filter(file => {
    const path = relative(root, file);
    return path !== 'scripts/checks/identifier-rules.mjs'
      && path !== 'scripts/checks/names.mjs'
      && !path.startsWith('scripts/checks/tests/');
  });
}

export async function scanText(root, inspect) {
  const errors = [];
  for (const file of await scanFiles(root)) {
    const data = await readFile(file);
    if (await approvedFont(root, relative(root, file), data)) continue;
    const text = data.toString('utf8');
    for (const rule of inspect(text)) errors.push(`${relative(root, file)}: ${rule}`);
  }
  return errors;
}

export function document(html) { return parse(html); }

export function attributes(html, { accessible = false } = {}) {
  const output = [];
  const names = new Set(['alt', 'aria-label', 'aria-description', 'title']);
  function visit(node) {
    for (const attr of node.attrs ?? []) {
      if (!accessible || names.has(attr.name) || (node.tagName === 'meta' && attr.name === 'content')) output.push(attr.value);
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(typeof html === 'string' ? document(html) : html);
  return output.join('\n');
}

export function visibleText(html, { excludedNodes = new Set() } = {}) {
  const output = [];
  function visit(node) {
    if (['script', 'style', 'template'].includes(node.tagName)) return;
    if (excludedNodes.has(node)) return;
    if (node.nodeName === '#text') output.push(node.value);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.tagName && !['span', 'a', 'em', 'strong', 'b', 'i', 'code'].includes(node.tagName)) output.push(' ');
  }
  visit(typeof html === 'string' ? document(html) : html);
  return output.join('');
}

export async function cli(url, check, args = process.argv.slice(2), diagnostic = error => safeError(error, 'publication-scan')) {
  if (!process.argv[1] || pathToFileURL(resolve(process.argv[1])).href !== url) return;
  let redact;
  try { redact = redactor(await denyTokens()); }
  catch { console.error('identifier-deny-tokens: cannot read external deny tokens'); process.exitCode = 1; return; }
  try {
    const root = process.cwd();
    const errors = await check(root, args);
    if (errors.length) {
      console.error(errors.map(redact).join('\n'));
      process.exitCode = 1;
    } else console.log('Check passed');
  } catch (error) {
    console.error(redact(diagnostic(error)));
    process.exitCode = 1;
  }
}
