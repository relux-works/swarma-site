import { readFile } from 'node:fs/promises';
import { tokenRanges } from './normalization.mjs';
import { readFileSync } from 'node:fs';

export const tokenPattern = /^[a-z0-9][a-z0-9._-]{2,}$/u;
export const splitTokens = text => {
  const tokens = text.split(/[,\r\n]+/u).map(token => token.replace(/^[ \t\r\n\v\f]+|[ \t\r\n\v\f]+$/gu, '')).filter(Boolean);
  if (!tokens.length || tokens.some(token => tokenPattern.exec(token)?.[0] !== token)) throw failure('identifier-deny-tokens');
  return tokens;
};
export async function readDenyTokens(file, environment = process.env.IDENT_DENY_TOKENS ?? '', ci = process.env.CI) {
  if (environment || (ci && !['0', 'false'].includes(ci.toLowerCase()))) return splitTokens(environment);
  try { return splitTokens(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw failure('identifier-deny-tokens'); }
}
export function readDenyTokensSync(file, environment = process.env.IDENT_DENY_TOKENS ?? '', ci = process.env.CI) {
  if (environment || (ci && !['0', 'false'].includes(ci.toLowerCase()))) return splitTokens(environment);
  try { return splitTokens(readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw failure('identifier-deny-tokens'); }
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
