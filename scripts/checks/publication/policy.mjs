import { readFile } from 'node:fs/promises';

export const splitTokens = text => text.split(/[,\r\n]+/u).map(token => token.trim()).filter(Boolean);
export async function readDenyTokens(file, environment = process.env.IDENT_DENY_TOKENS ?? '') {
  const tokens = splitTokens(environment);
  if (tokens.length) return tokens;
  try { return splitTokens(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw new Error('identifier-deny-tokens'); }
}
export function redactor(tokens) {
  // Longest first prevents a shorter token from exposing the rest of an overlapping literal.
  const patterns = [...tokens].sort((a, b) => b.length - a.length).map(token => new RegExp(token.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'giu'));
  return value => patterns.reduce((text, pattern) => text.replace(pattern, '[redacted]'), String(value));
}
export function failure(code) { const error = new Error(code); error.rule = code; return error; }
export const safeError = (error, fallback) => typeof error?.rule === 'string' && /^[a-z]+(?:-[a-z]+)+$/u.test(error.rule) ? error.rule : fallback;
