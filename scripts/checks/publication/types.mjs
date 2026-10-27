import { extname } from 'node:path';

// One explicit extension-to-reader contract for published files; unknown types have no fallback allowance.
const types = new Map([
  ['.html', 'html'], ['.htm', 'html'], ['.svg', 'svg'],
  ['.json', 'json'], ['.webmanifest', 'json'], ['.css', 'css'], ['.md', 'markdown'],
  ['.txt', 'text'], ['.js', 'text'],
  ['.png', 'binary'], ['.jpg', 'binary'], ['.jpeg', 'binary'], ['.gif', 'binary'],
  ['.webp', 'binary'], ['.ico', 'binary'], ['.woff', 'binary'], ['.woff2', 'binary'],
]);

export const publicationType = path => types.get(extname(path).toLowerCase());
