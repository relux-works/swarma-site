import chapters from '../data/book-chapters.json' with { type: 'json' };
import publications from '../data/publications.json' with { type: 'json' };
import figures from '../data/figures.json' with { type: 'json' };
const data = { 'book-chapters': chapters, publications, figures };
export const loadData = name => data[name];
export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
