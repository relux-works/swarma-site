import { readFileSync, existsSync } from 'node:fs';
import Slugger from 'github-slugger';
import { loadData, escape } from './content-data.mjs';
import { repositoryEntries } from './repository-render.mjs';
import { strings } from './strings.mjs';
const textOf = node => node.value ?? (node.children ?? []).map(textOf).join('');
const html = value => ({ type: 'html', value });
export function chapterReferences(text, lang) {
  const chapters = loadData('book-chapters');
  const prefix = strings[lang].source;
  const values = text.slice(prefix.length).split('; ');
  if (!values.length) throw new Error('malformed-reference');
  return `<p class="chapter-reference">${prefix}${values.map(value => {
    const pattern = lang === 'en' ? /^chapter (\d{2}) "([^"]+)"(?:, section "([^"]+)")?$/ : /^глава (\d{2}) "([^"]+)"(?:, раздел "([^"]+)")?$/;
    const match = pattern.exec(value);
    if (!match) throw new Error('malformed-reference');
    const chapter = chapters.find(chapter => chapter.number === match[1]);
    if (!chapter || (lang === 'en' ? chapter.title_en : chapter.title) !== match[2] || (match[3] && !chapter.sections.some(section => section[lang] === match[3]))) throw new Error('chapter-reference-mismatch');
    return `<a href="/${lang}/book/#ch${match[1]}">${escape(value)}</a>`;
  }).join('; ')}</p>`;
}
export function publicationEntries(kind, lang) {
  const data = loadData('publications'), labels = strings[lang];
  return (kind === 'book' ? [data.book] : data.papers).map(entry => `<article class="publication"><h2>${escape(entry.title)}</h2><p class="publication-subtitle">${escape(entry.subtitle)}</p><dl><div><dt>${labels.authors}</dt><dd>${escape(entry.authors.join(', '))}</dd></div>${entry.version ? `<div><dt>${labels.edition}</dt><dd><bdi class="technical">${escape(entry.version)}</bdi></dd></div>` : ''}<div><dt>${labels.date}</dt><dd class="technical">${escape(entry.date)}</dd></div><div><dt>${labels.language}</dt><dd>${escape(entry.language)}</dd></div></dl><p>${escape(entry.abstract)}</p><p class="pdf-placeholder">${labels.pdf}</p></article>`).join('');
}
export function bookFigure(name, lang, enabled = process.env.SWARMA_BOOK_FIGURES === '1') {
  const figure = loadData('figures')[name];
  if (!figure) throw new Error(`unknown-figure: ${name}`);
  if (!enabled) return '';
  const svg = readFileSync(new URL(`../assets/book-figures/${figure.file}`, import.meta.url), 'utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]?.split(/\s+/).map(Number);
  if (!viewBox || viewBox.length !== 4) throw new Error(`invalid-figure-viewbox: ${name}`);
  // An image data URI preserves the exact SVG bytes and emits no artifact in default builds.
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const source = lang === 'ru' ? `Источник: книга Swarma, версия 1.6.1, глава ${figure.chapter}, рисунок: ${figure.caption}` : `Source: Swarma book, version 1.6.1, chapter ${figure.chapter}, figure: ${figure.caption}`;
  return `<figure class="book-figure"><div class="figure-ground"><img src="${src}" width="${viewBox[2]}" height="${viewBox[3]}" alt="${escape(figure.alt)}"></div><figcaption>${escape(figure.caption)}<span class="chapter-reference">${escape(source)}</span></figcaption></figure>`;
}
export default function conventions({ figures = false } = {}) {
  return (tree, file) => {
    const frontmatter = file.data.astro?.frontmatter ?? {};
    if ('status_rows' in frontmatter || 'status_table' in frontmatter) throw new Error('status-forbidden');
    const path = String(file.path ?? file.history?.[0] ?? 'content.md');
    const match = /\/(ru|en)\/(.+)\.md$/.exec(path);
    const lang = match?.[1] ?? 'ru', slug = match?.[2] ?? '';
    const labels = strings[lang], slugger = new Slugger(), headings = [];
    const base = path.split(`/${lang}/`)[0];
    const source = readFileSync(path, 'utf8');
    if (/\[\[status\b/.test(source) || slug === 'status') throw new Error(`${path}:1: status-forbidden`);
    const body = String(file.value);
    const bodyOffset = body ? source.lastIndexOf(body) : 0;
    const prefix = bodyOffset >= 0 ? source.slice(0, bodyOffset) : '';
    const lineOffset = prefix.split('\n').length - 1;
    let limitIndex = 0, tableIndex = 0, sectionId = '';
    function fail(error, node) {
      if (error.conventionSource) throw error;
      const diagnostic = new Error(`${path}:${(node?.position?.start?.line ?? 1) + lineOffset}: ${error.message}`);
      diagnostic.conventionSource = true;
      throw diagnostic;
    }
    function visit(parent) {
      parent.children = (parent.children ?? []).flatMap(node => {
        try {
          if (node.type === 'heading' && [2, 3].includes(node.depth)) {
            const text = textOf(node), id = slugger.slug(text);
            node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
            sectionId = id;
            if (node.depth === 2) headings.push({ text, id });
          }
          if (node.type === 'table') {
            visit(node);
            return [html(`<div class="table-region" role="region" aria-label="${lang === 'en' ? 'Table' : 'Таблица'} ${++tableIndex}" tabindex="0">`), node, html('</div>')];
          }
          if (node.type === 'paragraph') {
            const text = textOf(node);
            if (text.startsWith('Источник: ') || text.startsWith('Source: ')) return html(chapterReferences(text, text.startsWith('Source: ') ? 'en' : 'ru'));
            if (text.includes('[[status')) throw new Error('status-forbidden');
            if (text === '[[repos]]') return html(repositoryEntries(lang));
            const figure = /^\[\[figure ([a-z0-9-]+)\]\]$/.exec(text);
            if (figure) { const rendered = bookFigure(figure[1], lang, figures); return rendered ? html(rendered) : []; }
            const publication = /^\[\[publications (book|papers)\]\]$/.exec(text);
            if (publication) return html(publicationEntries(publication[1], lang));
            if (/\[\[(?:status|figure|publications|repos)\b/.test(text)) throw new Error('malformed-marker');
          }
          if (node.type === 'blockquote' && node.children?.[0]?.type === 'paragraph' && node.children[0].children?.[0]?.type === 'strong' && /^(?:Предел\.|Limit\.)/.test(textOf(node.children[0].children[0]))) {
            const id = `limits-${++limitIndex}`;
            visit(node);
            return [html(`<aside class="limits" aria-labelledby="${sectionId ? escape(sectionId) + ' ' : ''}${id}"><h3 id="${id}">${labels.limits}</h3>`), ...node.children, html('</aside>')];
          }
          if (node.children) visit(node);
          return node;
        } catch (error) { fail(error, node); }
      });
    }
    visit(tree);
    const lead = tree.children.find(node => node.type === 'paragraph');
    if (lead) lead.data = { ...lead.data, hProperties: { className: ['lead'] } };
    const data = loadData('publications').book;
    const version = `<p class="version-context">${labels.version}, <bdi class="technical">${data.version}</bdi>, ${escape(data.date)}</p>`;
    const links = headings.map(heading => `<li><a href="#${escape(heading.id)}">${escape(heading.text)}</a></li>`).join('');
    const index = headings.length ? `<nav class="section-index" aria-label="${labels.sections}"><details open><summary>${labels.sections}</summary><ul>${links}</ul></details></nav>` : '';
    const firstSection = tree.children.findIndex(node => node.type === 'heading' && node.depth === 2);
    const introduction = firstSection < 0 ? tree.children : tree.children.slice(0, firstSection);
    const layers = slug === 'index' && introduction.find(node => node.type === 'paragraph' && ['Swarma Runtime', 'Swarma Protocol', 'Swarma Chain'].every(name => textOf(node).includes(name)));
    const insertion = layers ? tree.children.indexOf(layers) + 1 : lead ? tree.children.indexOf(lead) + 1 : 0;
    const bookHref = existsSync(`${base}/${lang}/book.md`) ? `/${lang}/book/` : '/ru/book/';
    const actions = slug === 'index' ? `<p class="home-actions"><a href="${bookHref}">${labels.book}</a></p>` : '';
    tree.children.splice(insertion, 0, html(version + actions + index));
    if (slug === 'index' && !introduction.some(node => textOf(node).includes(data.subtitle))) tree.children.unshift(html(`<p class="category">${escape(data.subtitle)}</p>`));
  };
}
