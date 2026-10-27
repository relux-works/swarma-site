import chapters from '../data/book-chapters.json' with { type: 'json' };
import publications from '../data/publications.json' with { type: 'json' };
import figures from '../data/figures.json' with { type: 'json' };
import layers from '../data/layers.json' with { type: 'json' };
import { diagnostic } from './diagnostics.mjs';
const data = { 'book-chapters': chapters, publications, figures, layers };
export const loadData = name => data[name];
export function publicationAuthors(entry, lang) {
  const authors = entry.authors?.[lang];
  if (!Array.isArray(authors) || !authors.length || authors.some(author => typeof author !== 'string' || !author.trim())) {
    throw diagnostic(`publication-authors: ${entry.id} (${lang})`);
  }
  return authors;
}
export function validateContentData() {
  for (const entry of [publications.book, ...publications.papers]) {
    for (const lang of ['ru', 'en']) publicationAuthors(entry, lang);
  }
  for (const chapter of chapters) for (const lang of ['ru', 'en']) {
    const title = chapter[`title_${lang}`];
    if (typeof title !== 'string' || !title.trim()) throw diagnostic(`chapter-title: ${chapter.number} (${lang})`);
  }
}
export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
