import { splitTokens } from './publication/policy.mjs';

// CI requires an explicit, valid policy; this preflight never consults a local file.
try { splitTokens(process.env.IDENT_DENY_TOKENS ?? ''); }
catch { console.error('identifier-deny-tokens'); process.exitCode = 1; }
