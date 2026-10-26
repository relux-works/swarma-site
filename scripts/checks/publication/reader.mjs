import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { failure } from './policy.mjs';

// Binary assets have explicit signatures. A renamed text file cannot obtain a binary exemption.
const signatures = new Map([
  ['.png', bytes => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))],
  ['.jpg', bytes => bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255],
  ['.jpeg', bytes => bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255],
  ['.gif', bytes => ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))],
  ['.webp', bytes => bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'],
  ['.ico', bytes => bytes.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))],
  ['.woff', bytes => bytes.subarray(0, 4).toString('ascii') === 'wOFF'],
  ['.woff2', bytes => bytes.subarray(0, 4).toString('ascii') === 'wOF2'],
]);
export async function readPublication(file) {
  const bytes = await readFile(file);
  const binary = signatures.get(extname(file).toLowerCase());
  if (binary) {
    if (!binary(bytes)) throw failure('publication-decode');
    return { bytes, text: '', binary: true };
  }
  // UTF-8 without BOM is the publication contract, including extensionless text and XML/SVG.
  if (bytes.subarray(0, 3).equals(Buffer.from([239, 187, 191])) || bytes.includes(0)) throw failure('publication-decode');
  try { return { bytes, text: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes), binary: false }; }
  catch { throw failure('publication-decode'); }
}
