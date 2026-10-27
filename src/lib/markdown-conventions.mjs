import { readFileSync, existsSync } from 'node:fs';
import Slugger from 'github-slugger';
import { loadData, escape, publicationAuthors } from './content-data.mjs';
import { repositoryEntries } from './repository-render.mjs';
import { strings } from './strings.mjs';
import { diagnostic } from './diagnostics.mjs';
import { bookFigureAsset } from './book-figures.mjs';
const textOf = node => node.value ?? (node.children ?? []).map(textOf).join('');
const html = value => ({ type: 'html', value });
export function chapterReferences(text, lang) {
  const chapters = loadData('book-chapters');
  const prefix = strings[lang].source;
  const values = text.slice(prefix.length).split('; ');
  if (!values.length) throw diagnostic('malformed-reference');
  return `<p class="chapter-reference">${prefix}${values.map(value => {
    const pattern = lang === 'en' ? /^chapter (\d{2}) "([^"]+)"(?:, section "([^"]+)")?$/ : /^глава (\d{2}) "([^"]+)"(?:, раздел "([^"]+)")?$/;
    const match = pattern.exec(value);
    if (!match) throw diagnostic('malformed-reference');
    const chapter = chapters.find(chapter => chapter.number === match[1]);
    if (!chapter || chapter[`title_${lang}`] !== match[2] || (match[3] && !chapter.sections.some(section => section[lang] === match[3]))) throw diagnostic('chapter-reference-mismatch');
    return `<a href="/${lang}/book/#ch${match[1]}">${escape(value)}</a>`;
  }).join('; ')}</p>`;
}
export function publicationEntries(kind, lang) {
  const data = loadData('publications'), labels = strings[lang];
  return (kind === 'book' ? [data.book] : data.papers).map(entry => {
    const authors = publicationAuthors(entry, lang);
    return `<article class="publication"><h2>${escape(entry.title)}</h2><p class="publication-subtitle">${escape(entry.subtitle)}</p><dl><div><dt>${labels.authors}</dt><dd>${escape(authors.join(', '))}</dd></div>${entry.version ? `<div><dt>${labels.edition}</dt><dd><bdi class="publication-value">${escape(entry.version)}</bdi></dd></div>` : ''}<div><dt>${labels.date}</dt><dd class="publication-value">${escape(entry.date)}</dd></div><div><dt>${labels.language}</dt><dd>${escape(entry.language)}</dd></div></dl><p>${escape(entry.abstract)}</p><p class="pdf-placeholder">${labels.pdf}</p></article>`;
  }).join('');
}
export function bookFigure(name, lang, enabled = process.env.SWARMA_BOOK_FIGURES === '1') {
  const figure = loadData('figures')[name];
  if (!figure) throw diagnostic(`unknown-figure: ${name}`);
  if (!enabled) return '';
  const { bytes, src } = bookFigureAsset(figure.file);
  const svg = bytes.toString('utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1]?.split(/\s+/).map(Number);
  if (!viewBox || viewBox.length !== 4) throw diagnostic(`invalid-figure-viewbox: ${name}`);
  const source = lang === 'ru' ? `Источник: книга Swarma, версия 1.6.1, глава ${figure.chapter}, рисунок: ${figure.caption}` : `Source: Swarma book, version 1.6.1, chapter ${figure.chapter}, figure: ${figure.caption}`;
  return `<figure class="book-figure"><div class="figure-ground"><img src="${src}" width="${viewBox[2]}" height="${viewBox[3]}" alt="${escape(figure.alt)}"></div><figcaption>${escape(figure.caption)}<span class="chapter-reference">${escape(source)}</span></figcaption></figure>`;
}
export function layerRows(lang) {
  return `<ol class="layer-rows">${loadData('layers').map(layer => `<li><span class="layer-number">${lang === 'en' ? 'layer' : 'слой'} ${layer.number}</span><div><a href="/${lang}${escape(layer.href)}">${escape(layer.name)}</a><p>${escape(layer.line[lang])}</p></div></li>`).join('')}</ol>`;
}
export default function conventions({ figures = false } = {}) {
  return (tree, file) => {
    const frontmatter = file.data.astro?.frontmatter ?? {};
    if ('status_rows' in frontmatter || 'status_table' in frontmatter) throw diagnostic('status-forbidden');
    const path = String(file.path ?? file.history?.[0] ?? 'content.md');
    const match = /\/(ru|en)\/(.+)\.md$/.exec(path);
    const lang = match?.[1] ?? 'ru', slug = match?.[2] ?? '';
    const labels = strings[lang], slugger = new Slugger(), headings = [];
    const base = path.split(`/${lang}/`)[0];
    const source = readFileSync(path, 'utf8');
    if (/\[\[status\b/.test(source) || slug === 'status') throw diagnostic(`${path}:1: status-forbidden`);
    const body = String(file.value);
    const bodyOffset = body ? source.lastIndexOf(body) : 0;
    const prefix = bodyOffset >= 0 ? source.slice(0, bodyOffset) : '';
    const lineOffset = prefix.split('\n').length - 1;
    let limitIndex = 0, tableIndex = 0, sectionId = '';
    function fail(error, node) {
      if (error.conventionSource) throw error;
      const failure = diagnostic(`${path}:${(node?.position?.start?.line ?? 1) + lineOffset}: ${error.message}`);
      failure.conventionSource = true;
      throw failure;
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
            if (text.includes('[[status')) throw diagnostic('status-forbidden');
            if (text === '[[layers]]') return html(layerRows(lang));
            if (text === '[[repos]]') return html(repositoryEntries(lang));
            const figure = /^\[\[figure ([a-z0-9-]+)\]\]$/.exec(text);
            if (figure) { const rendered = bookFigure(figure[1], lang, figures); return rendered ? html(rendered) : []; }
            const publication = /^\[\[publications (book|papers)\]\]$/.exec(text);
            if (publication) return html(publicationEntries(publication[1], lang));
            if (/\[\[(?:status|figure|publications|repos|layers)\b/.test(text)) throw diagnostic('malformed-marker');
          }
          if (node.type === 'blockquote' && node.children?.[0]?.type === 'paragraph' && node.children[0].children?.[0]?.type === 'strong' && /^(?:Предел\.|Limit\.)$/.test(textOf(node.children[0].children[0]))) {
            const id = `limits-${++limitIndex}`;
            node.children[0].children.shift();
            const first = node.children[0].children[0];
            if (first?.type === 'text') first.value = first.value.replace(/^\s+/, '');
            visit(node);
            return [html(`<aside class="limits" aria-labelledby="${sectionId ? escape(sectionId) + ' ' : ''}${id}"><h3 id="${id}">${labels.limits}</h3>`), ...node.children, html('</aside>')];
          }
          if (node.children) visit(node);
          return node;
        } catch (error) { fail(error, node); }
      });
    }
    if (slug === 'principles') {
      const names = ['Swarma Runtime', 'Swarma Protocol', 'Swarma Chain'];
      tree.children = tree.children.flatMap((node, i, nodes) => {
        const group = nodes.slice(i, i + 3);
        const matches = group.length === 3 && group.every((entry, n) => entry.type === 'paragraph' && entry.children?.[0]?.type === 'strong' && textOf(entry.children[0]) === names[n] + '.');
        if (node.layerStatement) return [];
        if (!matches) return node;
        const output = [html('<dl class="layer-rows--principle">')];
        group.forEach((entry, n) => {
          entry.layerStatement = true;
          const children = entry.children.slice(1);
          if (children[0]?.type === 'text') children[0].value = children[0].value.replace(/^\s+/, '');
          output.push(html(`<div><dt>${names[n]}</dt><dd>`), { type: 'paragraph', children }, html('</dd></div>'));
        });
        output.push(html('</dl>'));
        return output;
      });
    }
    visit(tree);
    const docs = ['platform', 'platform/runtime', 'platform/protocol', 'platform/chain', 'principles', 'open-source'].includes(slug);
    const home = slug === 'index';
    const firstSection = tree.children.findIndex(node => node.type === 'heading' && node.depth === 2);
    let introduction = firstSection < 0 ? tree.children : tree.children.slice(0, firstSection);
    let bodyNodes = firstSection < 0 ? [] : tree.children.slice(firstSection);
    // The repository list is body content even though this route has no authored h2 sections.
    if (slug === 'open-source' && firstSection < 0) {
      const repositoryList = node => node.type === 'html' && node.value.startsWith('<ul class="repository-list"');
      introduction = tree.children.filter(node => !repositoryList(node));
      bodyNodes = tree.children.filter(repositoryList);
    }
    const lead = introduction.find(node => node.type === 'paragraph');
    if (lead && docs) lead.data = { ...lead.data, hProperties: { className: ['lead'] } };
    const data = loadData('publications').book;
    const version = docs ? `<p class="version-context">${labels.version}, <bdi>${data.version}</bdi>, ${escape(data.date)}</p>` : '';
    const links = headings.map(heading => `<li><a href="#${escape(heading.id)}">${escape(heading.text)}</a></li>`).join('');
    const index = docs && headings.length >= 2 ? `<nav class="section-index" aria-label="${labels.sections}"><div class="index-column"><p>${labels.sections}</p><ul>${links}</ul></div><details><summary>${labels.sections}</summary><ul>${links}</ul></details></nav>` : '';
    const bookHref = existsSync(`${base}/${lang}/book.md`) ? `/${lang}/book/` : '/ru/book/';
    const openSourceHref = existsSync(`${base}/${lang}/open-source.md`) ? `/${lang}/open-source/` : '/ru/open-source/';
    const actions = home ? `<div class="home-actions"><a class="primary-action" href="${bookHref}">${labels.bookAction}</a><a href="${openSourceHref}">${labels.openSource}</a></div>` : '';
    const title = `<h1${home ? ' class="home-title"' : ''}>${escape(frontmatter.title ?? 'Swarma')}</h1>`;
    const category = home ? `<p class="category">${escape(labels.category)}</p>` : '';
    const intro = [];
    for (const node of introduction) {
      if (home && node.type === 'html' && node.value.startsWith('<p class="chapter-reference"')) intro.push(html(actions));
      intro.push(node);
    }
    if (home && !intro.some(node => node.type === 'html' && node.value === actions)) intro.push(html(actions));
    const sections = [];
    let opened = false;
    for (const node of bodyNodes) {
      if (node.type === 'heading' && node.depth === 2 && (docs || home)) {
        if (opened) sections.push(html(home ? '</div></section>' : '</section>'));
        sections.push(html(`<section class="${home ? 'home-band' : 'doc-section'}" aria-labelledby="${escape(node.data.hProperties.id)}">${home ? '<div class="container">' : ''}`));
        opened = true;
      }
      sections.push(node);
    }
    if (opened) sections.push(html(home ? '</div></section>' : '</section>'));
    tree.children = [
      ...(docs ? [html('<div class="page-grid">')] : []),
      html(`<div class="title-block${home ? ' container' : ''}">${title}${category}`), ...intro, html(version + '</div>' + index),
      html('<div class="page-body">'), ...sections, html('</div>'),
      ...(docs ? [html('</div>')] : []),
    ];
  };
}
