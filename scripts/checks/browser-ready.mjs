import { cli } from './lib.mjs';
import { publicationReader } from './publication-values.mjs';
import { denyTokens, redactor } from './scanner-policy.mjs';

export async function check(root) {
  const reader = await publicationReader(root);
  const redact = redactor(await denyTokens());
  try {
    const { values } = await reader.values('browser-readiness.html', '<p>Swarma</p>');
    return values.includes('Swarma') ? [] : ['publication-browser: missing rendered readiness text'];
  } catch (error) {
    // Preserve useful launch/library/socket diagnostics without external literals or home-directory paths.
    const message = redact(error.message).replace(/\/(?:home|Users)\/[^\s'"<>]+/gu, '[path]');
    return [`publication-browser: ${message}`];
  } finally { await reader.close(); }
}
await cli(import.meta.url, check);
