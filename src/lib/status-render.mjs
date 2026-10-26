import vocabulary from '../data/status/vocabulary.ru.json' with { type: 'json' };
import layers from '../data/status/layer-map.ru.json' with { type: 'json' };
import parts from '../data/status/parts.ru.json' with { type: 'json' };
import chapters from '../data/book-chapters.json' with { type: 'json' };
import publications from '../data/publications.json' with { type: 'json' };
import figures from '../data/figures.json' with { type: 'json' };
const data = { 'status/vocabulary.ru': vocabulary, 'status/layer-map.ru': layers, 'status/parts.ru': parts, 'book-chapters': chapters, publications, figures };
export const loadData = name => data[name];
export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const statusKinds = { 'работает сегодня': 'now', 'решено': 'decided', 'спецификация': 'specification', 'предложено': 'proposed', 'открыто': 'open' };
export const statusCaption = (title, lang = 'ru') => lang === 'en'
  ? `${title}. Swarma book, version 1.6.1, October 2026, chapter 30 "Where we are and what comes next". Quoted cells from the Russian edition.`
  : `${title}. Книга Swarma, версия 1.6.1, октябрь 2026, глава 30 "Где мы и что дальше"`;
export function statusRow(row) {
  const attrs = `data-status-source="book-1.6.1" data-status-row="${escape(row.id)}"`;
  if ('capability' in row) return `<tr ${attrs}><th scope="row">${escape(row.capability)}</th><td>${escape(row.works_today)}</td><td>${escape(row.not_yet)}</td><td>${escape(row.chapter)}</td></tr>`;
  if ('meaning' in row) return `<tr ${attrs}><th scope="row">${escape(row.status)}</th><td>${escape(row.meaning)}</td></tr>`;
  const kind = statusKinds[row.status];
  const status = kind ? `<span class="status-chip status-${kind}">${escape(row.status)}</span>` : escape(row.status);
  return `<tr ${attrs}><th scope="row">${escape(row.part)}</th><td>${escape(row.description)}</td><td>${status}</td></tr>`;
}
export function statusTable(rows, { parts = false, vocabulary = false, id = 'status-layer-map', title = 'Карта по слоям', lang = 'ru', labelledBy = '' } = {}) {
  const columns = lang === 'en' ? (vocabulary ? ['Status', 'Basis'] : parts ? ['Part', 'What it is', 'Status'] : ['Layer and capability', 'Works today', 'What is not there yet', 'Chapter']) : vocabulary ? ['Статус', 'Основание'] : parts ? ['Часть', 'Что это', 'Статус'] : ['Слой и возможность', 'Работает сегодня', 'Чего ещё нет', 'Глава'];
  return `<div class="table-region" role="region" aria-labelledby="${labelledBy ? escape(labelledBy) + ' ' : ''}${escape(id)}" tabindex="0"><table data-status-source="book-1.6.1"><caption id="${escape(id)}">${escape(statusCaption(title, lang))}</caption><thead><tr>${columns.map(column => `<th scope="col">${column}</th>`).join('')}</tr></thead><tbody${lang === 'en' ? ' lang="ru"' : ''}>${rows.map(statusRow).join('')}</tbody></table></div>`;
}
export function renderStatus({ ids, full = false, lang = 'ru', idPrefix = 'status-excerpt', labelledBy = '' } = {}) {
  const layers = loadData('status/layer-map.ru'); const parts = loadData('status/parts.ru');
  if (full) {
    const sections = [...new Set(parts.map(row => row.section))];
    return statusTable(layers, { lang, title: lang === 'en' ? 'Layer map' : 'Карта по слоям' }) + statusTable(loadData('status/vocabulary.ru'), { lang, vocabulary: true, id: 'status-vocabulary', title: lang === 'en' ? 'State by platform part' : 'Состояние по частям платформы' }) + sections.map((title, index) => statusTable(parts.filter(row => row.section === title), { lang, parts: true, id: `status-parts-${index}`, title })).join('');
  }
  const rows = ids.map(id => {
    const row = [...layers, ...parts].find(row => row.id === id);
    if (!row) throw new Error(`unknown-status-id: ${id}`); return row;
  });
  // Adjacent compatible keys share a native table; selection order stays the author's order.
  const groups = [];
  for (const row of rows) {
    const type = 'part' in row;
    if (!groups.length || groups.at(-1).parts !== type) groups.push({ parts: type, rows: [] });
    groups.at(-1).rows.push(row);
  }
  return groups.map((group, index) => statusTable(group.rows, { lang, labelledBy, parts: group.parts, id: `${idPrefix}-${index}`, title: lang === 'en' ? (group.parts ? 'State by platform part' : 'Layer map') : (group.parts ? 'Состояние по частям платформы' : 'Карта по слоям') })).join('');
}
