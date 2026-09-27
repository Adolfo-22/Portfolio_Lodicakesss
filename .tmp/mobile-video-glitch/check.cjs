const { chromium, webkit, devices } = require('C:/Users/adolf/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.PORTFOLIO_TEST_URL || 'http://localhost:3001';

async function inspect(page) {
  return page.evaluate(() => {
    const video = document.querySelector('.theme-toggle video');
    const canvas = document.querySelector('.theme-toggle canvas');
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let light = 0, alpha = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      light += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      alpha += pixels[i + 3];
    }
    return { time: video.currentTime, theme: document.documentElement.dataset.theme, paused: video.paused,
      alpha: alpha / (pixels.length / 4), brightness: light / (pixels.length / 4),
      transform: getComputedStyle(video).transform, canvasVisible: getComputedStyle(canvas).display !== 'none' };
  });
}

async function cycle(browserType, name, options = {}) {
  const browser = await browserType.launch();
  try {
    const page = await browser.newPage({ ...devices['iPhone 13'], ...options });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.log(name + ': ' + error.message); });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('video').readyState >= 2 && document.documentElement.dataset.theme === 'light' && document.querySelector('canvas').getContext('2d').getImageData(256, 256, 1, 1).data[3] > 0);
    const initial = await inspect(page);
    assert.equal(initial.theme, 'light');
    assert(initial.alpha > 250 && initial.brightness > 20, name + ': initial frame is painted');
    const toggle = page.locator('.mobile-theme-toggle');
    const frames = [];
    await toggle.tap();
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(100);
      frames.push(await inspect(page));
    }
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && document.querySelector('video').paused);
    const dark = await inspect(page);
    await page.locator('.theme-toggle').screenshot({ path: path.join(__dirname, name + '-dark.png') });
    await toggle.tap();
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(100);
      frames.push(await inspect(page));
    }
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light' && document.querySelector('video').currentTime < 0.05);
    const returned = await inspect(page);
    for (const frame of frames) {
      assert(frame.alpha > 250 && frame.brightness > 8, name + ': no empty or black presented frame');
      assert.equal(frame.transform, 'none', name + ': tapping does not leave a hover zoom');
    }
    assert(dark.brightness < initial.brightness * 0.7, name + ': video reaches the night frame');
    assert(Math.abs(returned.brightness - initial.brightness) < 5, name + ': video returns to the day frame');

    await toggle.tap();
    await page.waitForTimeout(450);
    await toggle.tap();
    await page.waitForTimeout(120);
    await toggle.tap();
    await page.waitForTimeout(200);
    await toggle.tap();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light' && document.querySelector('video').currentTime < 0.05);
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
    await page.setViewportSize({ width: 844, height: 390 });
    assert.equal((await inspect(page)).canvasVisible, true);
    await page.locator('.theme-toggle').tap();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.locator('.theme-toggle').screenshot({ path: path.join(__dirname, name + '-landscape.png') });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ name, initial, dark, returned, sampledFrames: frames.length, rapidTaps: 'passed', landscape: 'passed' }));
    await page.close();

    const slow = await browser.newPage({ ...devices['iPhone 13'], ...options });
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await slow.route('**/Theme/video-preview.mp4', async route => { await gate; await route.continue(); });
    await slow.goto(base, { waitUntil: 'domcontentloaded' });
    await slow.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    const slowToggle = slow.locator('.mobile-theme-toggle');
    await slowToggle.tap();
    await slowToggle.tap();
    await slowToggle.tap();
    await slow.locator('.theme-toggle').screenshot({ path: path.join(__dirname, name + '-slow-start.png') });
    release();
    await slow.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    assert((await inspect(slow)).brightness > 8);
    console.log(name + ': early taps while video loads passed');
    await slow.close();
  } finally { await browser.close(); }
}

(async () => {
  await fs.mkdir(__dirname, { recursive: true });
  await Promise.all([
    cycle(chromium, 'chromium-mobile'),
    cycle(webkit, 'webkit-mobile'),
    cycle(webkit, 'webkit-reduced-motion', { reducedMotion: 'reduce' }),
  ]);
})().catch(error => { console.error(error); process.exitCode = 1; });
