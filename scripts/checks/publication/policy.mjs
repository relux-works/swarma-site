import { readFile } from 'node:fs/promises';
import { tokenRanges } from './normalization.mjs';

export const splitTokens = text => text.split(/[,\r\n]+/u).map(token => token.trim()).filter(Boolean);
export async function readDenyTokens(file, environment = process.env.IDENT_DENY_TOKENS ?? '') {
  const tokens = splitTokens(environment);
  if (tokens.length) return tokens;
  try { return splitTokens(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw new Error('identifier-deny-tokens'); }
}
export function redactor(tokens) {
  return value => {
    let text = String(value);
    for (const [start, end] of tokenRanges(text, tokens).reverse()) text = text.slice(0, start) + '[redacted]' + text.slice(end);
    return text;
  };
}
export function failure(code) { const error = new Error(code); error.rule = code; return error; }
export const safeError = (error, fallback) => typeof error?.rule === 'string' && /^[a-z]+(?:-[a-z]+)+$/u.test(error.rule) ? error.rule : fallback;
