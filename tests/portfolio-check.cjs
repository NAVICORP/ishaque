const { chromium } = require('C:/Users/pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const testUrl = process.env.PORTFOLIO_URL || 'http://127.0.0.1:5173';

(async () => {
  fs.mkdirSync('_artifacts', { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  const results = [];

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(testUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);

    const headingVisible = await page.getByRole('heading', { name: /Ideas, made/i }).isVisible();
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const projectCount = await page.locator('.project-card').count();

    if (viewport.name === 'mobile') {
      await page.locator('.menu-toggle').click();
      const menuOpen = await page.locator('.mobile-menu').getAttribute('aria-hidden') === 'false';
      await page.keyboard.press('Escape');
      results.push({ viewport: viewport.name, errors, headingVisible, horizontalOverflow, projectCount, menuOpen });
    } else {
      await page.locator('.service-trigger').nth(1).click();
      await page.waitForTimeout(420);
      const secondServiceOpen = await page.locator('.service-trigger').nth(1).getAttribute('aria-expanded') === 'true';
      results.push({ viewport: viewport.name, errors, headingVisible, horizontalOverflow, projectCount, secondServiceOpen });
    }

    for (const item of await page.locator('.reveal').all()) {
      await item.scrollIntoViewIfNeeded();
      await page.waitForTimeout(45);
    }
    await page.screenshot({ path: `_artifacts/portfolio-${viewport.name}.jpg`, type: 'jpeg', quality: 84, fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  const failed = results.some(result => result.errors.length || !result.headingVisible || result.horizontalOverflow || result.projectCount !== 4 || result.menuOpen === false || result.secondServiceOpen === false);
  if (failed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
