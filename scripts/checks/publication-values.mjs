// Consumer-specific decoding mirrors the design-system checker; decoding never repeats arbitrarily.
import { extname } from 'node:path';
import { parseFragment } from 'parse5';
import { attributes, document, visibleText } from './lib.mjs';
import { cssValues, decodePercent } from './css-syntax.mjs';

const urlAttributes = new Set(['href', 'src', 'srcset', 'action', 'poster']);
function* strings(value) {
  if (typeof value === 'string') yield value;
  else if (Array.isArray(value)) { for (const item of value) yield* strings(item); }
  else if (value && typeof value === 'object') { for (const [key, item] of Object.entries(value)) { yield key; yield* strings(item); } }
}
function nodes(node) { return [node, ...(node.childNodes ?? []).flatMap(nodes), ...(node.content ? nodes(node.content) : [])]; }
function entities(text) {
  const fragment = parseFragment(`<textarea>${text.replaceAll('<', '&lt;')}</textarea>`);
  return nodes(fragment).filter(node => node.nodeName === '#text').map(node => node.value).join('');
}
function prose(text) {
  let fence;
  const lines = text.split(/(?<=\n)/u).map(line => {
    const marker = /^ {0,3}(`{3,}|~{3,})/u.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
      return line.endsWith('\n') ? '\n' : '';
    }
    if (marker) { fence = marker; return line.endsWith('\n') ? '\n' : ''; }
    return line;
  }).join('');
  return lines.replace(/(`+)(.*?)\1/gsu, value => value.replace(/[^\n]/gu, ' '));
}
function destination(text, start) {
  if (text[start] === '<') {
    const end = text.indexOf('>', start + 1);
    return end >= 0 ? text.slice(start + 1, end) : undefined;
  }
  let value = '', depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (character === '\\' && index + 1 < text.length) value += text[++index];
    else if (character === '(') { depth += 1; value += character; }
    else if (character === ')') { if (!depth) break; depth -= 1; value += character; }
    else if (/\s/u.test(character) && !depth) break;
    else value += character;
  }
  return depth ? undefined : value;
}
function* markup(text) {
  const parsed = nodes(document(text));
  yield parsed.filter(node => node.nodeName === '#text' && !['style', 'script'].includes(node.parentNode?.tagName)).map(node => node.value).join('');
  for (const node of parsed) {
    if (node.tagName === 'style') yield* cssValues((node.childNodes ?? []).filter(child => child.nodeName === '#text').map(child => child.value).join(''));
    if (node.tagName === 'script' && node.attrs?.some(attr => attr.name === 'type' && ['application/json', 'application/ld+json'].includes(attr.value.toLowerCase()))) {
      yield* strings(JSON.parse((node.childNodes ?? []).map(child => child.value ?? '').join('')));
    }
    for (const attr of node.attrs ?? []) {
      yield attr.value;
      if (urlAttributes.has(attr.name)) yield decodePercent(attr.value);
      if (attr.name === 'style') yield* cssValues(attr.value);
    }
  }
}

export function* publicationValues(path, text) {
  const suffix = extname(path).toLowerCase();
  if (suffix === '.json') yield* strings(JSON.parse(text));
  else if (suffix === '.css') yield* cssValues(text);
  else if (['.md', '.html', '.htm', '.svg', '.astro', '.mdx', '.vue', '.svelte'].includes(suffix)) {
    // SVG custom entities require a DTD-aware XML consumer. Reject rather than silently interpret them as HTML.
    if (suffix === '.svg' && (/<!DOCTYPE|<!ENTITY/iu.test(text) || /&(?!(?:amp|lt|gt|quot|apos);|#(?:[0-9]+|x[0-9a-f]+);)[a-z][a-z0-9]*;/iu.test(text))) throw new Error('unsupported SVG entity declaration');
    const body = suffix === '.md' ? prose(text) : text;
    yield* markup(body);
    if (suffix === '.md') {
      yield entities(body.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/gu, '$1'));
      for (const match of body.matchAll(/\]\([ \t\n]*|^ {0,3}\[[^\]\n]+\]:[ \t]*/gmu)) {
        const value = destination(body, match.index + match[0].length);
        if (value !== undefined) yield decodePercent(entities(value));
      }
    }
  } else {
    // Preserve the existing conservative markup scan of code and extensionless publication files.
    yield visibleText(text);
    yield attributes(text);
  }
}
