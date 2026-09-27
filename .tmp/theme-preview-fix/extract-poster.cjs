const { chromium } = require('C:/Users/adolf/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const { createServer } = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const videoBytes = await fs.readFile(path.resolve('public/Theme/video.mp4'));
  const server = createServer((request, response) => {
    if (request.url === '/video.mp4') {
      response.writeHead(200, { 'Content-Type': 'video/mp4' });
      response.end(videoBytes);
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<video src="/video.mp4" muted playsinline preload="auto"></video>');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
    const result = await page.evaluate(() => {
      const video = document.querySelector('video');
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = Math.round(512 * video.videoHeight / video.videoWidth);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      return { width: canvas.width, height: canvas.height, time: video.currentTime,
        data: canvas.toDataURL('image/webp', 0.85).split(',')[1] };
    });
    const posterPath = path.resolve('public/Theme/day-poster.webp');
    await fs.writeFile(posterPath, Buffer.from(result.data, 'base64'));
    console.log(JSON.stringify({ path: posterPath, width: result.width, height: result.height,
      mediaTime: result.time, bytes: (await fs.stat(posterPath)).size }));
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
