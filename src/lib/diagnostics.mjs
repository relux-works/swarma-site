import { homedir } from 'node:os';
import { join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';

import { readDenyTokensSync, redactor } from '../../scripts/checks/publication/policy.mjs';

const stateKey = Symbol.for('swarma.diagnostics');
let sanitize;
function policy() { return readDenyTokensSync(join(homedir(), '.config', 'swarma-site', 'deny-tokens.txt')); }
export function redact(value) { sanitize ??= redactor(policy()); return sanitize(value); }
export function diagnostic(value) { return new Error(redact(value)); }

// Frameworks may reformat errors with raw source paths/frames. Filter both output streams at the process boundary.
export function installDiagnostics() {
  if (globalThis[stateKey]) return;
  try { sanitize ??= redactor(policy()); }
  catch {
    process.stderr.write('diagnostic-policy: external policy is unreadable\n');
    process.exit(1);
  }
  globalThis[stateKey] = true;
  const flushers = [];
  for (const stream of [process.stdout, process.stderr]) {
    const write = stream.write.bind(stream), decoder = new StringDecoder('utf8');
    let pending = '';
    const flush = () => {
      pending += decoder.end();
      if (pending) write(redact(pending));
      pending = '';
    };
    flushers.push(flush);
    stream.write = (chunk, encoding, callback) => {
      if (typeof encoding === 'function') { callback = encoding; encoding = undefined; }
      pending += typeof chunk === 'string' ? chunk : decoder.write(Buffer.from(chunk));
      const boundary = pending.lastIndexOf('\n');
      let ready = true;
      if (boundary >= 0) {
        ready = write(redact(pending.slice(0, boundary + 1)), encoding);
        pending = pending.slice(boundary + 1);
      }
      if (callback) process.nextTick(callback);
      return ready;
    };
  }
  // Node's fatal formatter writes directly to its error channel, outside stream.write.
  const fatal = () => {
    process.stderr.write('build-diagnostic: unexpected failure\n');
    process.exit(1);
  };
  process.on('uncaughtException', fatal);
  process.on('unhandledRejection', fatal);
  process.on('beforeExit', () => flushers.forEach(flush => flush()));
  process.on('exit', () => flushers.forEach(flush => flush()));
}
