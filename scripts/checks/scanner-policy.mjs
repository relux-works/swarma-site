import { homedir } from 'node:os';
import { join } from 'node:path';
import { readDenyTokens } from './publication/policy.mjs';
export { redactor, failure, safeError } from './publication/policy.mjs';
export const denyTokens = () => readDenyTokens(join(homedir(), '.config', 'swarma-site', 'deny-tokens.txt'));
