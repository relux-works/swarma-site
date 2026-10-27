import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { fixture } from './fixture.mjs';
import { openBrowser } from '../publication/browser.mjs';
import { checkHeaderCentre } from '../header-geometry.mjs';

const repository = fileURLToPath(new URL('../../..', import.meta.url));
const css = (await Promise.all(['tokens.css', 'site.css'].map(name => readFile(join(repository, 'src/styles', name), 'utf8')))).join('\n');
const evidence = [];
after(async () => {
  await mkdir(join(repository, '.temp'), { recursive: true });
  await writeFile(join(repository, '.temp/header-centre-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
});

// The production gate accepts centred shipped CSS with default/overlay and genuine 15px classic scrollbars,
// on short and scrolling pages; its unchanged 1px tolerance accepts the boundary and rejects ±2px shifts.
for (const mode of ['default', 'classic']) test(`header centre: ${mode} scrollbars preserve the page axis and rejection`, async t => {
  const root = await fixture(t);
  let session;
  if (mode === 'classic') {
    const scratch = join(root, '.temp/classic-browser');
    await mkdir(scratch, { recursive: true });
    const browser = await chromium.launch({ headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      ignoreDefaultArgs: ['--hide-scrollbars'], args: ['--disable-features=OverlayScrollbar,FluentOverlayScrollbar'],
      downloadsPath: scratch, tracesDir: scratch,
      env: { ...process.env, XDG_CACHE_HOME: scratch, XDG_CONFIG_HOME: scratch, XDG_DATA_HOME: scratch },
    });
    session = { browser, close: () => browser.close() };
  } else session = await openBrowser(root);
  try {
    const page = await session.browser.newPage({ viewport: { width: 1440, height: 900 } });
    const record = { mode, browser: session.browser.version(), platform: process.platform, states: [] };
    for (const width of [1440, 1920]) for (const tall of [false, true]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(`<!doctype html><html lang="en"><head><style>${css}</style></head><body><header class="site-header"><div class="container header-inner" data-desktop="true"><a class="product-lockup">Swarma</a><nav class="desktop-nav" data-site-nav><ul><li><a>Platform</a></li></ul></nav><div class="header-end">EN</div></div></header><main style="height:${tall ? 2000 : 100}px">Diagram</main></body></html>`);
      const centred = await checkHeaderCentre(page, '/ru/platform/');
      assert.equal(centred.offset, 0);
      assert.equal(centred.innerWidth, width);
      if (mode === 'classic') {
        assert.equal(centred.innerWidth - centred.rootWidth, 15, 'the classic scrollbar gutter must actually be present');
        assert.equal(centred.clientWidth, tall ? width - 15 : width);
      }
      assert.equal(centred.scrollHeight > centred.viewportHeight, tall);
      const shifts = [];
      for (const shift of [1, -1, 2, -2]) {
        await page.locator('[data-site-nav]').evaluate((node, shift) => { node.style.transform = `translateX(${shift}px)`; }, shift);
        if (Math.abs(shift) === 1) assert.equal((await checkHeaderCentre(page, '/ru/platform/')).offset, 1);
        else await assert.rejects(checkHeaderCentre(page, '/ru/platform/'), /a11y-header: \/ru\/platform\/ centre offset 2/);
        shifts.push({ shift, accepted: Math.abs(shift) === 1 });
      }
      await page.locator('[data-site-nav]').evaluate(node => { node.style.transform = ''; });
      assert.equal((await checkHeaderCentre(page, '/ru/platform/')).offset, 0);
      record.states.push({ width, tall, centred, shifts });
    }
    evidence.push(record);
  } finally { await session.close(); }
});
