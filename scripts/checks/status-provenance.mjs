import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { document, filesAt } from './lib.mjs';

const marker = 'data-status-source';
const rowMarker = 'data-status-row';
const componentPaths = new Set(['src/components/StatusTable.astro', 'src/components/StatusRow.astro']);
const headings = ['Слой и возможность', 'Работает сегодня', 'Чего ещё нет', 'Глава'];
const text = value => ['#text', value];
const element = (tag, attrs, children) => [tag, Object.entries(attrs).sort(), children];
const cell = (tag, value, scope) => element(tag, scope ? { scope } : {}, [text(value)]);

function expectedRow(row) {
  return element('tr', { [marker]: 'book-1.6.1', [rowMarker]: row.id }, [
    cell('th', row.capability, 'row'), cell('td', row.works_today), cell('td', row.not_yet), cell('td', row.chapter),
  ]);
}
function expectedTable(rows) {
  return element('table', { [marker]: 'book-1.6.1' }, [
    element('caption', {}, [text('Карта по слоям')]),
    element('thead', {}, [element('tr', {}, headings.map(value => cell('th', value, 'col')))]),
    element('tbody', {}, rows.map(expectedRow)),
  ]);
}
function structure(node) {
  if (node.nodeName === '#text') return text(node.value);
  // Whitespace between structural table elements is formatting; cell text remains exact.
  const structural = new Set(['table', 'thead', 'tbody', 'tr']);
  const children = (node.childNodes ?? []).filter(child => !(structural.has(node.tagName) && child.nodeName === '#text' && /^\s*$/.test(child.value)));
  return [node.tagName ?? node.nodeName, (node.attrs ?? []).map(attr => [attr.name, attr.value]).sort(), children.map(structure)];
}

export async function markerLocations(root) {
  const errors = [];
  for (const file of [...await filesAt(root, 'src'), ...await filesAt(root, 'public')]) {
    const path = relative(root, file);
    if (!componentPaths.has(path) && /data-status-source/i.test(await readFile(file, 'utf8'))) errors.push(`${path}: status-marker-location`);
  }
  return errors;
}

export async function verifiedRegions(root, html) {
  const parsed = document(html);
  const marked = [];
  function visit(node) {
    if (node.attrs?.some(attr => attr.name === marker)) marked.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(parsed);
  const excludedNodes = new Set();
  const errors = [];
  if (marked.length) {
    const rows = JSON.parse(await readFile(join(root, 'src/data/status/layer-map.ru.json'), 'utf8'));
    for (const node of marked) {
      const id = node.attrs.find(attr => attr.name === rowMarker)?.value;
      const row = rows.find(row => row.id === id);
      const expected = node.tagName === 'table' ? expectedTable(rows) : node.tagName === 'tr' && row ? expectedRow(row) : null;
      if (!expected || JSON.stringify(structure(node)) !== JSON.stringify(expected)) errors.push('status-provenance');
      else excludedNodes.add(node);
    }
  }
  return { parsed, excludedNodes, errors };
}
