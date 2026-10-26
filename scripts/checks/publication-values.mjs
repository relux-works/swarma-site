// Site adapter; the publication directory is portable and has no site imports.
import { publicationReader as renderer } from './publication/renderer.mjs';
export { publicationHTML, jsonStrings } from './publication/renderer.mjs';
export const publicationReader = root => renderer(root, { assetRoots: ['dist', 'public'] });
