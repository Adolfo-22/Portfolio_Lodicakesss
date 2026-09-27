const { chromium, devices } = require('C:/Users/adolf/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('../../node_modules/sharp');

const output = __dirname;
const base = 'http://localhost:3002';
const report = [];

async function capturePreview(page, name) {
  const screenshot = await page.locator('.theme-toggle video').screenshot();
  await fs.writeFile(path.join(output, `${name}.png`), screenshot);
  const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let coloredPixels = 0;
  for (let index = 0; index < data.length; index += info.channels) {
    const channels = [data[index], data[index + 1], data[index + 2]];
    if (Math.max(...channels) - Math.min(...channels) > 12) coloredPixels++;
  }
  return coloredPixels / (info.width * info.height);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const baseline = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await baseline.route('**/Theme/video.mp4*', route => route.abort());
    await baseline.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const baselineColor = await capturePreview(baseline, 'before-unavailable-video');
    assert(baselineColor < 0.01, 'Original preview reproduces the empty tile when media is unavailable');
    report.push({ scenario: 'original preview, video unavailable', coloredPixelRatio: baselineColor });
    await baseline.close();

    for (const [name, options] of [
      ['desktop', { viewport: { width: 1440, height: 1000 } }],
      ['mobile', { ...devices['iPhone 13'], defaultBrowserType: undefined }],
      ['mobile-reduced-motion', { ...devices['iPhone 13'], defaultBrowserType: undefined, reducedMotion: 'reduce' }],
      ['mobile-no-javascript', { ...devices['iPhone 13'], defaultBrowserType: undefined, javaScriptEnabled: false }],
    ]) {
      const context = await browser.newContext(options);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/Theme/video.mp4*', route => route.abort());
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('video').evaluate(async video => {
        const poster = new Image();
        poster.src = video.poster;
        await poster.decode();
      });
      const color = await capturePreview(page, `${name}-unavailable-video`);
      // Chromium adds a dark native media overlay when page JavaScript is disabled.
      assert(color > (options.javaScriptEnabled === false ? 0.005 : 0.05), `${name}: first-frame image is visible without video data or a click`);
      assert.equal(await page.locator('video').evaluate(video => video.currentTime), 0);
      assert.deepEqual(errors, []);
      report.push({ scenario: `${name}, video unavailable`, coloredPixelRatio: color });
      await context.close();
    }

    for (const [name, options, toggle] of [
      ['desktop', { viewport: { width: 1440, height: 1000 } }, '.theme-toggle'],
      ['mobile', { ...devices['iPhone 13'], defaultBrowserType: undefined }, '.mobile-theme-toggle'],
      ['mobile-reduced-motion', { ...devices['iPhone 13'], defaultBrowserType: undefined, reducedMotion: 'reduce' }, '.mobile-theme-toggle'],
    ]) {
      const context = await browser.newContext(options);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
      assert.equal(await page.locator('video').evaluate(video => video.paused), true);
      assert(await capturePreview(page, `${name}-initial`) > 0.05);
      await page.locator(toggle).click();
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
      await page.waitForFunction(() => document.querySelector('video').ended || matchMedia('(prefers-reduced-motion: reduce)').matches);
      await page.locator('.theme-toggle').screenshot({ path: path.join(output, `${name}-dark.png`) });
      await page.locator(toggle).click();
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light' && document.querySelector('video').currentTime < 0.05);
      assert(await capturePreview(page, `${name}-returned-light`) > 0.05);
      assert.deepEqual(errors, []);
      report.push({ scenario: `${name}, normal media`, result: 'initial preview, light to dark to light passed' });
      await context.close();
    }
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
