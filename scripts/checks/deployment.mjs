import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { cli, filesAt } from './lib.mjs';

export const contentPolicy = "default-src 'self'; font-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'";
const requiredHeaders = {
  'content-security-policy': contentPolicy,
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'cross-origin-opener-policy': 'same-origin',
};
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const failure = () => Object.assign(new Error(), { rule: 'deployment-headers' });

// This local mirror accepts the shipped path/single-splat/header subset, not the complete provider grammar.
export function parseHeaders(source) {
  const rules = [];
  for (const line of source.split(/\r?\n/u)) {
    if (!line.trim() || line.startsWith('#')) continue;
    if (line.length > 2000) throw failure();
    if (!/^\s/u.test(line)) {
      if (!/^\/\S*$/u.test(line) || (line.match(/\*/gu) ?? []).length > 1) throw failure();
      const expression = line.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('.*');
      rules.push({ pattern: new RegExp(`^${expression}$`, 'u'), headers: {} });
    } else {
      const match = /^\s+([A-Za-z0-9-]+):\s*(\S.*)$/u.exec(line);
      if (!match || !rules.length) throw failure();
      const headers = rules.at(-1).headers, key = match[1].toLowerCase();
      headers[key] = headers[key] ? `${headers[key]}, ${match[2]}` : match[2];
    }
  }
  if (!rules.length) throw failure();
  return rules;
}
export function headersFor(rules, path) {
  const result = {};
  for (const rule of rules) if (rule.pattern.test(path)) for (const [key, value] of Object.entries(rule.headers)) {
    result[key] = result[key] ? `${result[key]}, ${value}` : value;
  }
  return result;
}

// Bound to loopback on an ephemeral port; every caller closes it in finally. No deployment or remote service is used.
export async function staticServer(directory, rules) {
  const root = await realpath(directory);
  const within = path => { const suffix = relative(root, path); return suffix !== '..' && !suffix.startsWith('../'); };
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = resolve(root, '.' + path), status = 200;
      if (!within(file)) throw failure();
      try { if (path.split('/').includes('_headers')) throw failure(); if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); await stat(file); }
      catch { file = join(root, '404.html'); status = 404; }
      if (!within(await realpath(file))) throw failure();
      const body = await readFile(file);
      const contentType = extname(file) ? mime[extname(file)] : 'application/json';
      response.writeHead(status, { 'content-type': contentType || 'application/octet-stream', ...headersFor(rules, path) });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch { response.writeHead(500, { 'Content-Type': 'text/plain' }); response.end('Static check failed'); }
  });
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept); });
  return { origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((accept, reject) => { server.closeAllConnections(); server.close(error => error ? reject(error) : accept()); }) };
}

export async function inspectPage(page, url) {
  const consoleViolations = [], failedRequests = [];
  const consoleListener = message => { if (/content security policy/iu.test(message.text())) consoleViolations.push(message.type()); };
  const requestListener = request => failedRequests.push(request.failure()?.errorText ?? 'request-failed');
  page.on('console', consoleListener); page.on('requestfailed', requestListener);
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    const observation = await page.evaluate(async () => {
      await document.fonts.ready;
      return { violations: window.__deploymentViolations, allowedFeatures: document.featurePolicy.allowedFeatures(),
        features: document.featurePolicy.features(), text: document.body.innerText,
        stylesheets: [...document.styleSheets].filter(sheet => sheet.href).length };
    });
    return { ...observation, status: response.status(), headers: response.headers(), consoleViolations, failedRequests };
  } finally { page.off('console', consoleListener); page.off('requestfailed', requestListener); }
}
export async function preparePage(context) {
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__deploymentViolations = [];
    addEventListener('securitypolicyviolation', event => window.__deploymentViolations.push(event.effectiveDirective));
  });
  return page;
}
export async function deploymentFiles(root) {
  const policy = JSON.parse(await readFile(join(root, 'config/deployment-files.json'), 'utf8'));
  if (!policy || Object.keys(policy).sort().join() !== 'allow,headerSelectors' || !Array.isArray(policy.allow) || policy.allow.length !== 4
    || !Array.isArray(policy.headerSelectors) || policy.headerSelectors.length !== 1) throw failure();
  const seen = new Set();
  for (const entry of policy.allow) {
    if (!entry || Object.keys(entry).sort().join() !== 'path,sha256' || typeof entry.path !== 'string'
      || !/^(?:public|dist)\/\.well-known\/[a-z]+\/(?:server|client)$/u.test(entry.path)
      || !/^[a-f0-9]{64}$/u.test(entry.sha256) || seen.has(entry.path)) throw failure();
    seen.add(entry.path);
  }
  const selector = policy.headerSelectors[0];
  if (!selector || Object.keys(selector).sort().join() !== 'line,paths'
    || JSON.stringify(selector.paths) !== JSON.stringify(['public/_headers', 'dist/_headers'])
    || typeof selector.line !== 'string' || !/^\/\.well-known\/[a-z]+\/\*$/u.test(selector.line)) throw failure();
  const errors = [];
  for (const entry of policy.allow) {
    try {
      const actual = createHash('sha256').update(await readFile(join(root, entry.path))).digest('hex');
      if (actual !== entry.sha256) errors.push(`${entry.path}: deployment-machine-file`);
    } catch { errors.push(`${entry.path}: deployment-machine-file`); }
  }
  return { policy, errors };
}

export async function check(root) {
  let pinned;
  try { pinned = await deploymentFiles(root); } catch { return ['deployment-config: invalid pinned files']; }
  const errors = [...pinned.errors], pages = (await filesAt(root, 'dist')).filter(file => file.endsWith('.html'));
  if (!pages.length) return ['deployment-build: no built pages'];
  let rules;
  try { rules = parseHeaders(await readFile(join(root, 'dist/_headers'), 'utf8')); }
  catch { return ['deployment-headers: invalid built headers']; }
  try {
    if (!(await readFile(join(root, 'public/_headers'))).equals(await readFile(join(root, 'dist/_headers')))) errors.push('dist/_headers: deployment-headers');
  } catch { errors.push('dist/_headers: deployment-headers'); }
  let server, browser;
  try {
    server = await staticServer(join(root, 'dist'), rules);
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === server.origin ? route.continue() : route.abort());
    const page = await preparePage(context);
    for (const file of pages) {
      const path = '/' + relative(join(root, 'dist'), file).split('/').map(encodeURIComponent).join('/');
      const observation = await inspectPage(page, server.origin + path);
      if (observation.status !== 200 || Object.entries(requiredHeaders).some(([key, value]) => observation.headers[key] !== value)
        || !observation.headers['permissions-policy'] || observation.headers['strict-transport-security']) errors.push(`${relative(root, file)}: deployment-headers`);
      if (observation.violations.length || observation.consoleViolations.length || observation.failedRequests.length) errors.push(`${relative(root, file)}: deployment-csp`);
      if (observation.headers['access-control-allow-origin']) errors.push(`${relative(root, file)}: deployment-headers`);
      if (observation.allowedFeatures.length) errors.push(`${relative(root, file)}: deployment-permissions`);
      if (!observation.text.trim() || !observation.stylesheets) errors.push(`${relative(root, file)}: deployment-page`);
    }
    for (const entry of pinned.policy.allow.filter(entry => entry.path.startsWith('public/'))) {
      const response = await fetch(server.origin + entry.path.slice('public'.length));
      if (response.status !== 200 || response.headers.get('content-type') !== 'application/json'
        || response.headers.get('access-control-allow-origin') !== '*') errors.push(`${entry.path}: deployment-headers`);
    }
    const missing = await inspectPage(page, server.origin + '/missing-deployment-page');
    if (missing.status !== 404 || !missing.text.includes('Страница не найдена') || !missing.text.includes('Page not found')) errors.push('dist/404.html: deployment-not-found');
    if (missing.violations.length || missing.consoleViolations.length) errors.push('dist/404.html: deployment-csp');
  } finally { try { await browser?.close(); } finally { await server?.close(); } }
  return [...new Set(errors)];
}
await cli(import.meta.url, check);
