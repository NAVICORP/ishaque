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
    { name: 'mobile', width: 390, height: 844 },
    { name: 'mobile-small', width: 375, height: 812 }
  ]) {
    const isMobile = viewport.width <= 620;
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(testUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    if (isMobile) await page.screenshot({ path: `_artifacts/portfolio-${viewport.name}-fold.jpg`, type: 'jpeg', quality: 90 });

    const headingVisible = await page.getByRole('heading', { name: /Ideas, made/i }).isVisible();
    const heroImageCurrentSrc = await page.locator('.hero-picture img').evaluate(image => image.currentSrc);
    const heroLedeVisible = await page.locator('.hero-lede').isVisible();
    const heroEyebrowVisible = await page.locator('.hero-copy .eyebrow').isVisible();
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const projectCount = await page.locator('.project-card').count();
    const overallRatingVisible = await page.getByText('Overall rating', { exact: true }).isVisible();
    const exploreWorksVisible = await page.getByRole('link', { name: /Explore Works/i }).isVisible();
    const cvLink = page.getByRole('link', { name: /Download CV/i });
    const cvHref = await cvLink.getAttribute('href');
    const cvDownload = await cvLink.getAttribute('download');
    const cvResponse = await page.request.get(`${testUrl}${cvHref}`);
    const cvAvailable = cvResponse.ok() && (cvResponse.headers()['content-type'] || '').includes('application/pdf');
    const whatsapp = page.locator('.whatsapp-float');
    const whatsappHref = await whatsapp.getAttribute('href');
    const whatsappIconOnly = await whatsapp.evaluate(element => element.textContent.trim() === '' && Boolean(element.querySelector('svg')));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(120);
    const whatsappPosition = await whatsapp.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const edgeGap = window.innerWidth - rect.right;
      return {
        visible: rect.width > 0 && rect.height >= 44,
        rightAligned: edgeGap >= 12 && edgeGap <= 40,
        edgeGap,
        fixed: getComputedStyle(element).position === 'fixed',
        withinViewport: rect.bottom <= window.innerHeight && rect.top >= 0
      };
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(450);

    if (isMobile) {
      await page.locator('.menu-toggle').click();
      const menuOpen = await page.locator('.mobile-menu').getAttribute('aria-hidden') === 'false';
      await page.keyboard.press('Escape');
      results.push({ page: 'home', viewport: viewport.name, errors, headingVisible, horizontalOverflow, projectCount, menuOpen, whatsappHref, whatsappPosition, whatsappIconOnly, overallRatingVisible, exploreWorksVisible, cvHref, cvDownload, cvAvailable, ogImage, twitterCard, heroImageCurrentSrc, heroLedeVisible, heroEyebrowVisible });
    } else {
      await page.locator('.service-trigger').nth(1).click();
      await page.waitForTimeout(420);
      const secondServiceOpen = await page.locator('.service-trigger').nth(1).getAttribute('aria-expanded') === 'true';
      results.push({ page: 'home', viewport: viewport.name, errors, headingVisible, horizontalOverflow, projectCount, secondServiceOpen, whatsappHref, whatsappPosition, whatsappIconOnly, overallRatingVisible, exploreWorksVisible, cvHref, cvDownload, cvAvailable, ogImage, twitterCard, heroImageCurrentSrc, heroLedeVisible, heroEyebrowVisible });
    }

    for (const item of await page.locator('.reveal:not([hidden])').all()) {
      await item.scrollIntoViewIfNeeded();
      await page.waitForTimeout(45);
    }
    await page.screenshot({ path: `_artifacts/portfolio-${viewport.name}.jpg`, type: 'jpeg', quality: 84, fullPage: true });
    await page.close();
  }

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${testUrl}/projects.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    if (viewport.name === 'mobile') await page.screenshot({ path: '_artifacts/projects-mobile-fold.jpg', type: 'jpeg', quality: 90 });

    const initialVisibleCount = await page.locator('.portfolio-card:not([hidden])').count();
    const paginationVisibleInitially = await page.locator('[data-project-pagination]').isVisible();
    const initialPageCount = await page.locator('[data-project-pagination] button[aria-label^="Page "]').count();
    const paginationGroups = await page.locator('[data-project-pagination] > *').count();
    const initialCurrentPage = await page.locator('[data-project-pagination] [aria-current="page"]').textContent();
    await page.locator('[data-project-pagination] [aria-label="Page 2"]').click();
    const secondPageVisibleCount = await page.locator('.portfolio-card:not([hidden])').count();
    const secondPageCurrent = await page.locator('[data-project-pagination] [aria-current="page"]').textContent();

    await page.locator('[data-project-pagination] [aria-label="Page 1"]').click();
    for (let pageNumber = 1; pageNumber <= 6; pageNumber += 1) {
      for (const card of await page.locator('.portfolio-card:not([hidden])').all()) {
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(30);
      }
      if (pageNumber < 6) await page.locator('[data-project-pagination] [aria-label="Next project page"]').click();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const headingVisible = await page.getByRole('heading', { name: /Stories built/i }).isVisible();
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const projectCount = await page.locator('.portfolio-card').count();
    const uniqueLinks = await page.locator('.portfolio-card').evaluateAll(cards => new Set(cards.map(card => card.href)).size);
    const missingImages = await page.locator('.portfolio-image img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).length);
    const whatsappHref = await page.locator('.whatsapp-float').getAttribute('href');

    await page.locator('[data-project-filter="pitch"]').click();
    const initialPitchCount = await page.locator('.portfolio-card:not([hidden])').count();
    await page.locator('[data-project-pagination] [aria-label="Page 2"]').click();
    const secondPitchPageCount = await page.locator('.portfolio-card:not([hidden])').count();
    await page.locator('[data-project-filter="website"]').click();
    const initialWebsiteCount = await page.locator('.portfolio-card:not([hidden])').count();
    await page.locator('[data-project-pagination] [aria-label="Page 2"]').click();
    const secondWebsitePageCount = await page.locator('.portfolio-card:not([hidden])').count();
    await page.locator('[data-project-filter="fiverr"]').click();
    const visibleFiverrCount = await page.locator('.portfolio-card:not([hidden])').count();
    const fiverrPaginationHidden = !(await page.locator('[data-project-pagination]').isVisible());
    results.push({ page: 'projects', viewport: viewport.name, errors, headingVisible, horizontalOverflow, projectCount, uniqueLinks, missingImages, initialVisibleCount, paginationVisibleInitially, initialPageCount, paginationGroups, initialCurrentPage, secondPageVisibleCount, secondPageCurrent, initialPitchCount, secondPitchPageCount, initialWebsiteCount, secondWebsitePageCount, visibleFiverrCount, fiverrPaginationHidden, whatsappHref, ogImage, twitterCard });

    await page.locator('[data-project-filter="all"]').click();
    for (const item of await page.locator('.reveal:not([hidden])').all()) {
      await item.scrollIntoViewIfNeeded();
      await page.waitForTimeout(35);
    }
    await page.screenshot({ path: `_artifacts/projects-${viewport.name}.jpg`, type: 'jpeg', quality: 84, fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  const failed = results.some(result => {
    if (result.errors.length || !result.headingVisible || result.horizontalOverflow) return true;
    if (result.whatsappHref !== 'https://wa.me/917827087878') return true;
    if (result.ogImage !== 'https://ishaquenv.com/assets/portfolio/og-image.png' || result.twitterCard !== 'summary_large_image') return true;
    if (result.page === 'home') return result.projectCount !== 6 || result.menuOpen === false || result.secondServiceOpen === false || !result.whatsappPosition.visible || !result.whatsappPosition.rightAligned || !result.whatsappPosition.fixed || !result.whatsappPosition.withinViewport || !result.whatsappIconOnly || !result.exploreWorksVisible || result.cvHref !== '/assets/portfolio/Muhammed-Ishaque-CV.pdf' || result.cvDownload !== 'Muhammed-Ishaque-CV.pdf' || !result.cvAvailable || (result.viewport !== 'desktop' ? result.overallRatingVisible || result.heroLedeVisible || result.heroEyebrowVisible || !result.heroImageCurrentSrc.endsWith('/assets/portfolio/ishaque-hero-mobile.png') : !result.overallRatingVisible || !result.heroLedeVisible || !result.heroEyebrowVisible || !result.heroImageCurrentSrc.endsWith('/assets/portfolio/ishaque-hero.png'));
    return result.projectCount !== 52 || result.uniqueLinks < 47 || result.missingImages !== 0 || result.initialVisibleCount !== 10 || !result.paginationVisibleInitially || result.initialPageCount !== (result.viewport === 'mobile' ? 4 : 6) || result.paginationGroups !== 3 || result.initialCurrentPage !== '1' || result.secondPageVisibleCount !== 10 || result.secondPageCurrent !== '2' || result.initialPitchCount !== 10 || result.secondPitchPageCount !== 2 || result.initialWebsiteCount !== 10 || result.secondWebsitePageCount !== 6 || result.visibleFiverrCount !== 7 || !result.fiverrPaginationHidden;
  });
  if (failed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
