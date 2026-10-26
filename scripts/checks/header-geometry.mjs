// Every integer width is measured against real browser boxes, with normal and doubled root text.
export async function headerGeometry(page, origin, route, plant = false) {
  await page.goto(origin + route);
  await page.evaluate(() => document.fonts.ready);
  const frames = await page.evaluate(async ({ route, plant }) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;top:0;left:0;height:900px;border:0;';
    frame.src = route;
    await new Promise(resolve => { frame.onload = resolve; document.body.append(frame); });
    const doc = frame.contentDocument, win = frame.contentWindow;
    await doc.fonts.ready;
    if (plant) {
      const style = doc.createElement('style');
      style.textContent = '.desktop-nav { visibility: visible !important; position: absolute !important; left: 0 !important; top: 0 !important; }';
      doc.head.append(style);
    }
    const snapshots = [], collisions = [];
    const rect = node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > .5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > .5;
    for (const size of [16, 32]) {
      doc.documentElement.style.fontSize = `${size}px`;
      for (let width = 320; width <= 1920; width++) {
        frame.style.width = `${width}px`;
        void doc.documentElement.clientWidth;
        win.dispatchEvent(new Event('resize'));
        const identity = rect(doc.querySelector('.product-lockup'));
        const image = rect(doc.querySelector('.product-lockup img'));
        const nav = doc.querySelector('.desktop-nav');
        const expanded = win.getComputedStyle(nav).visibility === 'visible';
        const targets = [doc.querySelector('.header-end'), ...(expanded ? [nav] : [])].map(rect);
        const padding = win.getComputedStyle(doc.querySelector('.product-lockup'));
        const clear = 12 * image.width / 344;
        if (image.width < 160 - .1 || parseFloat(padding.paddingLeft) < clear || parseFloat(padding.paddingRight) < clear || parseFloat(padding.paddingTop) < clear || parseFloat(padding.paddingBottom) < clear || targets.some(target => overlaps(identity, target))) collisions.push({ width, size, identity, targets, image });
        if (width % 100 === 0 || [320, 390, 768, 1099, 1100, 1280, 1440, 1920].includes(width)) snapshots.push({ width, size, expanded, identity, targets, image });
      }
    }
    frame.remove();
    return { observations: 3202, snapshots, collisions };
  }, { route, plant });
  if (frames.collisions.length) throw new Error(`header-geometry: ${route}: ${JSON.stringify(frames.collisions.slice(0, 3))}`);
  // At enlarged text, the disclosure must retain its keyboard focus contract around the historical collision widths.
  for (const width of [320, 1100, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; window.dispatchEvent(new Event('resize')); });
    const trigger = page.locator('.menu-trigger');
    if (await trigger.isVisible()) {
      await trigger.focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('#site-menu').open && document.activeElement === document.querySelector('.menu-close'));
      await page.keyboard.press('Shift+Tab');
      if (!await page.locator('#site-menu').evaluate(node => node.contains(document.activeElement))) throw new Error('header-geometry: focus containment');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('#site-menu').open && document.activeElement === document.querySelector('.menu-trigger'));
    }
  }
  return { route, ...frames, keyboardWidths: [320, 1100, 1280] };
}
