import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { cli, filesAt, scanFiles } from './lib.mjs';
import { identifierRules } from './identifier-rules.mjs';
import { publicationReader } from './publication-values.mjs';
import { readPublication } from './publication-reader.mjs';
import { denyTokens, redactor } from './scanner-policy.mjs';

export async function check(root) {
  let redact = redactor((process.env.IDENT_DENY_TOKENS ?? '').split(/[,\r\n]+/u).filter(Boolean));
  const reader = await publicationReader(root);
  const errors = [];
  try {
    let tokens;
    try { tokens = await denyTokens(); }
    catch { return [redact('identifier-deny-tokens: cannot read external deny tokens')]; }
    redact = redactor(tokens);
    const ci = Boolean(process.env.CI && !['0', 'false'].includes(process.env.CI.toLowerCase()));
    if (!tokens.length) {
      if (!ci) console.warn('Warning: external deny tokens are missing; only generic rules are running');
      if (ci || process.env.IDENT_DENY_TOKENS_OPTIONAL !== '1') errors.push('identifier-deny-tokens: external deny tokens are required');
    }
    let allowlist;
    try {
      allowlist = JSON.parse(await readFile(join(root, 'config/public-repos.json'), 'utf8'));
      if (!allowlist || Array.isArray(allowlist) || ['repositories', 'emails'].some(key => !Array.isArray(allowlist[key]) || allowlist[key].some(value => typeof value !== 'string'))) throw new Error();
    } catch { return [...errors, 'identifier-allowlist: invalid configuration'].map(redact); }

    const generic = new Set(await scanFiles(root));
    // External literals cover policy sources and controls too; generic fixture exemptions do not apply.
    const ignored = new Set(['.git', '.temp', '.astro', '.val', 'node_modules', 'context']);
    const roots = (await readdir(root)).filter(path => !ignored.has(path));
    for (const file of (await Promise.all(roots.map(path => filesAt(root, path)))).flat()) {
      const path = relative(root, file);
      let publication;
      try { publication = await readPublication(file); }
      catch (error) { if (error.rule === 'publication-decode') { errors.push(`${path}: publication-decode`); continue; } throw error; }
      const { text, bytes, binary } = publication;
      const values = [text];
      try { if (!binary) values.push(...(await reader.values(path, text)).values); }
      catch { errors.push(`${path}: publication-decode`); }
      if (generic.has(file)) for (const value of values) for (const rule of identifierRules(value, allowlist)) errors.push(`${path}: ${rule}`);
      if ([path, ...(binary ? [bytes.toString('latin1')] : []), ...values].some(value => tokens.some(token => value.toLowerCase().includes(token.toLowerCase())))) errors.push(`${path}: deny-token`);
    }
  } catch {
    // Filesystem and traversal exception messages can contain paths or file contents. Never echo them.
    errors.push('identifier-scan: cannot inspect publication files');
  }
  finally { await reader.close(); }
  return [...new Set(errors.map(redact))];
}
// The CLI fallback also stays fixed if an error occurs before check() can establish its policy.
await cli(import.meta.url, check, undefined, () => 'identifier-scan: cannot run identifier check');
