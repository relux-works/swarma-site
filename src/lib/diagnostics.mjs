import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';

const stateKey = Symbol.for('swarma.diagnostics');
function policy() {
  const configured = process.env.IDENT_DENY_TOKENS;
  let source = configured;
  if (!source?.trim()) {
    try { source = readFileSync(join(homedir(), '.config', 'swarma-site', 'deny-tokens.txt'), 'utf8'); }
    catch (error) {
      if (error.code !== 'ENOENT') throw new Error('diagnostic-policy: external policy is unreadable');
      source = '';
    }
  }
  return [...new Set(source.split(/[,\r\n]+/).map(value => value.trim()).filter(Boolean))];
}
let tokens;
export function redact(value) {
  tokens ??= policy();
  let text = String(value);
  // Longest first prevents a short configured prefix exposing the remainder of a longer value.
  for (const token of [...tokens].sort((a, b) => b.length - a.length)) {
    text = text.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[redacted]');
  }
  return text;
}
export function diagnostic(value) { return new Error(redact(value)); }

// Frameworks may reformat errors with raw source paths/frames. Filter both output streams at the process boundary.
export function installDiagnostics() {
  if (globalThis[stateKey]) return;
  try { tokens ??= policy(); }
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
