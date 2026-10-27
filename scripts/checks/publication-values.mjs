// Site adapter; the publication directory is portable and has no site imports.
import { publicationReader as renderer } from './publication/renderer.mjs';
import { publicationType } from './publication/types.mjs';
export { publicationHTML, jsonStrings } from './publication/renderer.mjs';

// These format exceptions do not exempt machine payload hashes or header contents from their existing checks.
const exactTypes = new Map(['public', 'dist'].flatMap(prefix => [
  [`${prefix}/.well-known/matrix/client`, 'json'], [`${prefix}/.well-known/matrix/server`, 'json'],
  [`${prefix}/_headers`, 'text'],
]));
const readerType = path => exactTypes.get(path) ?? publicationType(path);
export const publicationFileType = path => /^(?:public|dist)\/\.well-known\//u.test(path) && !exactTypes.has(path)
  ? undefined : readerType(path);
export const publicationReader = root => renderer(root, { assetRoots: ['dist', 'public'], fileType: readerType });
