import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { attributes, cli, filesAt, scanText, visibleText } from './lib.mjs';
import { identifierRules } from './identifier-rules.mjs';

async function denyTokens() {
  const split = text => text.split(/[,\r\n]+/u).map(token => token.trim()).filter(Boolean);
  const tokens = split(process.env.IDENT_DENY_TOKENS ?? '');
  if (tokens.length) return tokens;
  try {
    return split(await readFile(join(homedir(), '.config', 'swarma-site', 'deny-tokens.txt'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error('identifier-deny-tokens: cannot read external deny tokens');
  }
}

export async function check(root) {
  const allowlist = JSON.parse(await readFile(join(root, 'config/public-repos.json'), 'utf8'));
  if (!Array.isArray(allowlist.repositories) || !Array.isArray(allowlist.emails)) return ['identifier-allowlist: invalid configuration'];
  const tokens = await denyTokens();
  const ci = Boolean(process.env.CI && !['0', 'false'].includes(process.env.CI.toLowerCase()));
  const errors = [];
  if (!tokens.length) {
    if (!ci) console.warn('Warning: external deny tokens are missing; only generic rules are running');
    if (ci || process.env.IDENT_DENY_TOKENS_OPTIONAL !== '1') errors.push('identifier-deny-tokens: external deny tokens are required');
  }
  errors.push(...await scanText(root, text => identifierRules(`${text}\n${visibleText(text)}\n${attributes(text)}`, allowlist)));
  // External literals cover policy sources and controls too; generic fixture exemptions do not apply.
  const ignored = new Set(['.git', '.temp', '.astro', '.val', 'node_modules', 'context']);
  const roots = (await readdir(root)).filter(path => !ignored.has(path));
  for (const file of (await Promise.all(roots.map(path => filesAt(root, path)))).flat()) {
    const text = await readFile(file, 'utf8');
    const value = `${relative(root, file)}\n${text}\n${visibleText(text)}\n${attributes(text)}`.toLowerCase();
    if (tokens.some(token => value.includes(token.toLowerCase()))) errors.push(`${relative(root, file)}: deny-token`);
  }
  return errors.map(error => tokens.reduce((text, token) => text.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'giu'), '[redacted]'), error));
}
await cli(import.meta.url, check);
