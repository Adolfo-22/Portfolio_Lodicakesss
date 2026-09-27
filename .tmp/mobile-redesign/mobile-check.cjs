/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('C:/Users/adolf/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce', deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  const report = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    const original = window.setInterval;
    window.setInterval = (callback, delay, ...args) => [2000, 5000].includes(delay) ? 0 : original(callback, delay, ...args);
  });
  const dir = path.join(__dirname, 'toggle-after');
  await fs.mkdir(dir, { recursive: true });
  const openButton = page.getByRole('button', { name: 'Open navigation', exact: true });
  const dialog = page.locator('#mobile-menu');
  const waitClosed = () => page.waitForFunction(() => !document.querySelector('#mobile-menu').open && document.body.style.position !== 'fixed');
  for (const width of [320, 375, 390, 430, 480, 620, 621, 768, 900]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
    await openButton.waitFor();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#home img').evaluate(img => img.decode());
    const layout = await page.evaluate(() => {
      const offenders = [...document.querySelectorAll('main *')].filter(el => {
        if (!el.getClientRects().length || el.closest('[aria-hidden="true"]') || el.closest('svg') || el.tagName === 'DIALOG') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
      }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.slice(0, 50), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right }));
      const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      return { width: window.innerWidth, documentWidth: document.documentElement.scrollWidth, offenders, header: rect(document.querySelector('.responsive-header')), image: rect(document.querySelector('#home img')), heading: rect(document.querySelector('#home h1')) };
    });
    assert.equal(layout.documentWidth, width, `Document overflow at ${width}`);
    assert.deepEqual(layout.offenders, [], `Elements outside viewport at ${width}: ${JSON.stringify(layout.offenders)}`);
    const headerParts = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
      return { avatar: rect('.theme-toggle'), info: rect('.mobile-header-info'), menu: rect('.mobile-menu-button'), header: rect('.responsive-header'), email: rect('.mobile-header-email'), theme: rect('.mobile-theme-toggle') };
    });
    assert(headerParts.avatar.right < headerParts.info.left, 'Theme preview and contact details do not overlap');
    assert(headerParts.info.right < headerParts.menu.left, 'Contact details and hamburger do not overlap');
    assert(headerParts.info.top >= 0 && headerParts.info.bottom <= headerParts.header.bottom, 'Contact details fit inside header');
    assert(headerParts.avatar.bottom < headerParts.header.bottom, 'Divider is below the entire theme preview');
    assert(headerParts.theme.top > headerParts.email.bottom, 'Theme switch sits below email');
    assert(headerParts.theme.left >= headerParts.email.left, 'Theme switch aligns with email');
    assert(headerParts.theme.left > headerParts.avatar.right, 'Theme switch is outside the image');
    assert.equal(await page.locator('.theme-toggle-controls').isVisible(), false, 'Original overlay is hidden on mobile');
    assert.equal(await page.locator('.theme-toggle video').count(), 1, 'Theme preview retains one video');
    assert.equal(await page.locator('.mobile-header-email').getAttribute('href'), 'mailto:adolfoproilan@gmail.com');
    assert.equal(await page.locator('.mobile-header-meta a').getAttribute('href'), 'tel:+639518841563');
    if (width <= 620) assert(layout.heading.y > layout.image.y + layout.image.height + 44, 'Heading overlaps carousel');
    await page.screenshot({ path: path.join(dir, `mobile-${width}.png`), fullPage: true });
    if ([320, 390, 480, 768].includes(width)) await page.screenshot({ path: path.join(dir, `hero-${width}.png`) });
    if (width === 480) {
      await page.getByRole('button', { name: 'Show profile image 2', exact: true }).click();
      await page.getByRole('button', { name: 'Proilan M. Adolfo — tap to reveal in color', exact: true }).click();
      await page.locator('#home img').evaluate(img => img.decode());
      await page.screenshot({ path: path.join(dir, 'reference-480-color.png') });
      await page.getByRole('button', { name: 'Proilan M. Adolfo — tap to reveal in color', exact: true }).click();
      await page.getByRole('button', { name: 'Show profile image 1', exact: true }).click();
    }

    await openButton.click();
    await page.waitForFunction(() => document.querySelector('#mobile-menu').open);
    assert.equal(await dialog.locator('.mobile-menu-links a').count(), 6);
    assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
    assert(await dialog.evaluate(el => el.contains(document.activeElement)), 'Focus enters drawer');
    await page.keyboard.press('Shift+Tab');
    assert(await dialog.evaluate(el => el.contains(document.activeElement)), 'Focus remains trapped');
    await page.keyboard.press('Tab');
    assert(await dialog.evaluate(el => el.contains(document.activeElement)), 'Forward focus remains trapped');
    if ([320, 390, 768].includes(width)) await page.screenshot({ path: path.join(dir, `menu-${width}.png`) });
    await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
    await waitClosed();
    assert.equal(await openButton.getAttribute('aria-expanded'), 'false');
    assert(await openButton.evaluate(el => document.activeElement === el), 'Focus returns to hamburger');

    await openButton.click();
    await page.keyboard.press('Escape');
    await waitClosed();
    await openButton.click();
    await page.mouse.click(4, 150);
    await waitClosed();

    for (const id of ['about', 'writing', 'projects', 'experience', 'education', 'contact']) {
      await openButton.click();
      await dialog.locator(`a[href="#${id}"]`).click();
      await waitClosed();
      assert.equal(await page.evaluate(() => window.location.hash), `#${id}`);
      const target = await page.locator(`#${id}`).boundingBox();
      assert(target.y >= Math.max(headerParts.avatar.bottom, headerParts.header.bottom) && target.y < 844, `${id} hidden by header or offscreen at ${width}: ${target.y}`);
    }

    const beforeScroll = await page.evaluate(() => window.scrollY);
    assert.equal((await page.locator('.responsive-header').boundingBox()).y, 0, 'Header stays available while scrolling');
    await openButton.click();
    const lockedY = await page.evaluate(() => document.body.style.top);
    await page.mouse.move(5, 500);
    await page.mouse.wheel(0, 500);
    assert.equal(await page.evaluate(() => document.body.style.top), lockedY);
    await page.keyboard.press('Escape');
    await waitClosed();
    const restoredScroll = await page.evaluate(() => window.scrollY);
    assert(Math.abs(restoredScroll - beforeScroll) <= 1, `Closing restores original scroll position: ${beforeScroll} -> ${restoredScroll}, locked top ${lockedY}`);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const portrait = page.locator('#home img');
    const initialSrc = await portrait.getAttribute('src');
    await page.getByRole('button', { name: 'Next profile image', exact: true }).click();
    assert.notEqual(await portrait.getAttribute('src'), initialSrc);
    await page.getByRole('button', { name: 'Previous profile image', exact: true }).click();
    assert.equal(await portrait.getAttribute('src'), initialSrc);
    await page.getByRole('button', { name: 'Show profile image 2', exact: true }).click();
    assert.equal(await portrait.getAttribute('src'), '/profile-2.jpg');

    const theme = page.getByRole('button', { name: 'Toggle color theme', exact: true });
    await theme.click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    if (width === 390) {
      await page.screenshot({ path: path.join(dir, 'hero-390-dark.png') });
      await openButton.click();
      await page.screenshot({ path: path.join(dir, 'menu-390-dark.png') });
      await page.keyboard.press('Escape');
      await waitClosed();
    }
    await theme.click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    report.push({ width, layout, navigation: '6 anchors, close, Escape, backdrop, focus trap, scroll restoration passed', carousel: 'next, previous, direct selection passed', theme: 'light/dark/light passed' });
    console.log(`${width}px: layout, menu, all anchors, focus, scroll lock, carousel, theme passed`);
  }

  // Crossing the breakpoint must clear the modal and scroll lock immediately.
  await openButton.click();
  await page.setViewportSize({ width: 1100, height: 844 });
  await waitClosed();
  assert.equal(await page.locator('.sidebar').isVisible(), true);
  assert.equal(await openButton.isVisible(), false);

  // Exercise the animated path too, including all supported dismissals.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const dismissal of ['button', 'escape', 'backdrop', 'link']) {
    await openButton.click();
    await page.waitForTimeout(260);
    if (dismissal === 'button') await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
    if (dismissal === 'escape') await page.keyboard.press('Escape');
    if (dismissal === 'backdrop') await page.mouse.click(4, 150);
    if (dismissal === 'link') await dialog.locator('a[href="#projects"]').click();
    await waitClosed();
  }
  await page.waitForFunction(() => { const target = document.querySelector('#projects'); const y = target.getBoundingClientRect().y; return Math.abs(y - parseFloat(getComputedStyle(target).scrollMarginTop)) < 2; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole('button', { name: 'Open Student Gate Attendance project details', exact: true }).click();
  const projectDialog = page.getByRole('dialog', { name: 'IoT-powered attendance monitoring with geotagging and geolocation', exact: true });
  await projectDialog.waitFor();
  const projectBounds = await projectDialog.boundingBox();
  assert(projectBounds.x >= 0 && projectBounds.x + projectBounds.width <= 320);
  await page.getByRole('button', { name: 'Close project details', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 320 });
  await openButton.click();
  assert(await dialog.evaluate(el => el.scrollHeight > el.clientHeight), 'Short viewport drawer can scroll');
  await dialog.getByRole('link', { name: 'Resume', exact: true }).focus();
  assert(await dialog.evaluate(el => el.scrollTop > 0), 'Drawer footer reachable on a short screen');
  await page.keyboard.press('Escape');
  await waitClosed();
  assert.deepEqual(errors, [], `Browser errors: ${errors.join(', ')}`);
  await fs.writeFile(path.join(dir, 'mobile-report.json'), JSON.stringify({ report, errors, resize: 'passed', animations: 'passed' }, null, 2));
  await browser.close();
  console.log('All responsive browser checks passed.');
})().catch(error => { console.error(error); process.exit(1); });
