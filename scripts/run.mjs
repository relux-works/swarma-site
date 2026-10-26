// Start this supervisor before loading application, framework or checker code.
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { constants } from 'node:os';

let child;
const fail = () => {
  child?.kill('SIGTERM');
  process.stderr.write('diagnostic-boundary: command unavailable\n');
  process.exit(1);
};
process.on('uncaughtException', fail);
process.on('unhandledRejection', fail);

try {
  // Dynamic loading keeps policy/module failures inside the fail-closed boundary.
  const { readDenyTokensSync, redactor } = await import('./checks/publication/policy.mjs');
  const sanitize = redactor(readDenyTokensSync(join(homedir(), '.config/swarma-site/deny-tokens.txt')));
  const args = process.argv.slice(2);
  if (!args.length) throw new Error();
  const shell = args[0] === '--shell';
  if (shell && args.length !== 2) throw new Error();
  child = spawn(shell ? args[1] : args[0], shell ? [] : args.slice(1), {
    shell, stdio: ['inherit', 'pipe', 'pipe'],
  });
  for (const [source, destination] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    const decoder = new StringDecoder('utf8');
    let pending = '';
    source.on('data', bytes => {
      pending += decoder.write(bytes);
      const end = pending.lastIndexOf('\n');
      if (end >= 0) {
        destination.write(sanitize(pending.slice(0, end + 1)));
        pending = pending.slice(end + 1);
      }
    });
    source.on('end', () => {
      pending += decoder.end();
      if (pending) destination.write(sanitize(pending));
    });
    source.on('error', fail);
  }
  child.on('error', fail);
  // Forward interruption to the owned child; close waits for both redacted pipes to finish.
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => child.kill(signal));
  child.on('close', (code, signal) => {
    process.exitCode = code ?? 128 + (constants.signals[signal] ?? 1);
  });
} catch { fail(); }
