/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('C:/Users/adolf/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const phase = process.argv[2] || 'before';
  const dir = path.join(__dirname, phase);
  await fs.mkdir(dir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce', deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    const original = window.setInterval;
    window.setInterval = (callback, delay, ...args) => [2000, 5000].includes(delay) ? 0 : original(callback, delay, ...args);
  });
  for (const width of [901, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
    await page.locator('#home h1').waitFor();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].filter(img => img.loading !== 'lazy').map(img => img.decode().catch(() => {}))));
    await page.locator('.theme-toggle video').evaluate(video => new Promise(resolve => {
      if (video.readyState >= 2) resolve(); else video.addEventListener('loadeddata', resolve, { once: true });
    }));
    await page.screenshot({ path: path.join(dir, `desktop-${width}.png`), fullPage: true });
    const layout = await page.evaluate(() => [...document.querySelectorAll('.sidebar, .icon-sidebar, .theme-toggle, #home, #home h1, #home img, #home p, #home a, #about, #writing, #projects, #stack, #contact')].map(el => {
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return { selector: el.id || el.className, rect: [rect.x, rect.y, rect.width, rect.height], font: css.font, padding: css.padding, margin: css.margin, color: css.color, background: css.background };
    }));
    await fs.writeFile(path.join(dir, `desktop-${width}.json`), JSON.stringify(layout, null, 2));
  }
  await browser.close();
  console.log(`Desktop ${phase} snapshots saved.`);
})().catch(error => { console.error(error); process.exit(1); });
