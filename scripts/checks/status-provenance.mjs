import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { document, filesAt } from './lib.mjs';

const marker = 'data-status-source';
const rowMarker = 'data-status-row';
const componentPaths = new Set(['src/components/StatusTable.astro', 'src/components/StatusRow.astro', 'src/lib/status-render.mjs']);
const headings = ['Слой и возможность', 'Работает сегодня', 'Чего ещё нет', 'Глава'];
const partsHeadings = ['Часть', 'Что это', 'Статус'];
const kinds = { 'работает сегодня': 'now', 'решено': 'decided', 'спецификация': 'specification', 'предложено': 'proposed', 'открыто': 'open' };
const text = value => ['#text', value];
const element = (tag, attrs, children) => [tag, Object.entries(attrs).sort(), children];
const cell = (tag, value, scope) => element(tag, scope ? { scope } : {}, [text(value)]);

function expectedRow(row) {
  const attrs = { [marker]: 'book-1.6.1', [rowMarker]: row.id };
  if ('capability' in row) return element('tr', attrs, [cell('th', row.capability, 'row'), cell('td', row.works_today), cell('td', row.not_yet), cell('td', row.chapter)]);
  if ('meaning' in row) return element('tr', attrs, [cell('th', row.status, 'row'), cell('td', row.meaning)]);
  const status = kinds[row.status] ? element('span', { class: `status-chip status-${kinds[row.status]}` }, [text(row.status)]) : text(row.status);
  return element('tr', attrs, [cell('th', row.part, 'row'), cell('td', row.description), element('td', {}, [status])]);
}
function structure(node) {
  if (node.nodeName === '#text') return text(node.value);
  // Formatting whitespace between table structures has no cell meaning.
  const structural = new Set(['table', 'thead', 'tbody', 'tr']);
  const children = (node.childNodes ?? []).filter(child => !(structural.has(node.tagName) && child.nodeName === '#text' && /^\s*$/.test(child.value)));
  return [node.tagName ?? node.nodeName, (node.attrs ?? []).map(attr => [attr.name, attr.value]).sort(), children.map(structure)];
}
const attribute = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
function expectedTable(node, rows) {
  const body = node.childNodes.find(child => child.tagName === 'tbody');
  const rowNodes = body?.childNodes.filter(child => child.tagName === 'tr') ?? [];
  const selected = rowNodes.map(node => rows.find(row => row.id === attribute(node, rowMarker)));
  if (!selected.length || selected.some(row => !row) || new Set(selected.map(row => row.id)).size !== selected.length) return null;
  const vocabulary = 'meaning' in selected[0];
  const parts = 'part' in selected[0];
  if (selected.some(row => ('part' in row) !== parts || ('meaning' in row) !== vocabulary)) return null;
  const caption = node.childNodes.find(child => child.tagName === 'caption');
  const id = attribute(caption, 'id');
  const titles = vocabulary ? ['Состояние по частям платформы'] : parts ? ['Состояние по частям платформы', ...new Set(selected.map(row => row.section))] : ['Карта по слоям'];
  if (!id || !/^(?:status-layer-map|status-vocabulary|status-parts-\d+|status-excerpt-\d+)$/.test(id)) return null;
  const title = titles.find(title => JSON.stringify(structure(caption)) === JSON.stringify(element('caption', { id }, [text(`${title}. Книга Swarma, версия 1.6.1, октябрь 2026, глава 30 "Где мы и что дальше"`)])));
  if (!title) return null;
  if (id === 'status-layer-map') {
    const canonical = rows.filter(row => 'capability' in row);
    if (selected.map(row => row.id).join('|') !== canonical.map(row => row.id).join('|')) return null;
  }
  if (id.startsWith('status-parts-')) {
    const canonical = rows.filter(row => row.section === title);
    if (selected.map(row => row.id).join('|') !== canonical.map(row => row.id).join('|')) return null;
  }
  return element('table', { [marker]: 'book-1.6.1' }, [
    element('caption', { id }, [text(`${title}. Книга Swarma, версия 1.6.1, октябрь 2026, глава 30 "Где мы и что дальше"`)]),
    element('thead', {}, [element('tr', {}, (vocabulary ? ['Статус', 'Основание'] : parts ? partsHeadings : headings).map(value => cell('th', value, 'col')))]),
    element('tbody', {}, selected.map(expectedRow)),
  ]);
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
  const parsed = document(html), marked = [];
  function visit(node) {
    if (node.attrs?.some(attr => attr.name === marker)) marked.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(parsed);
  const excludedNodes = new Set(), errors = [];
  if (marked.length) {
    const rows = JSON.parse(await readFile(join(root, 'src/data/status/layer-map.ru.json'), 'utf8'));
    for (const path of ['src/data/status/parts.ru.json', 'src/data/status/vocabulary.ru.json']) {
      const found = await filesAt(root, path);
      if (found.length) rows.push(...JSON.parse(await readFile(found[0], 'utf8')));
    }
    for (const node of marked) {
      const row = rows.find(row => row.id === attribute(node, rowMarker));
      const expected = node.tagName === 'table' ? expectedTable(node, rows) : node.tagName === 'tr' && row ? expectedRow(row) : null;
      if (!expected || JSON.stringify(structure(node)) !== JSON.stringify(expected)) errors.push('status-provenance');
      else excludedNodes.add(node);
    }
  }
  return { parsed, excludedNodes, errors };
}
