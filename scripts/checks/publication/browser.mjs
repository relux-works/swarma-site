import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

// One browser lifetime for structural, contrast and accessibility consumers, including isolated HOME fixtures.
export async function openBrowser(root) {
  const temp = join(root, '.temp/publication-browser');
  await mkdir(temp, { recursive: true });
  const scratch = await mkdtemp(join(temp, 'run-'));
  let browser;
  try {
    // Preserve the caller's short OS temp for Chromium's Unix socket; document depth must not affect it.
    browser = await chromium.launch({
      headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      downloadsPath: scratch, tracesDir: scratch,
      env: { ...process.env, XDG_CACHE_HOME: join(scratch, 'cache'), XDG_CONFIG_HOME: join(scratch, 'config'), XDG_DATA_HOME: join(scratch, 'data') },
    });
  } catch (error) { await rm(scratch, { recursive: true, force: true }); throw error; }
  return { browser, async close() { try { await browser.close(); } finally { await rm(scratch, { recursive: true, force: true }); } } };
}
