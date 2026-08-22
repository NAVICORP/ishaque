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
    await page.route('https://api.web3forms.com/submit', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Email sent successfully!' })
    }));
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(testUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    if (isMobile) await page.screenshot({ path: `_artifacts/portfolio-${viewport.name}-fold.jpg`, type: 'jpeg', quality: 90 });
    if (isMobile) {
      await page.locator('.quote-section').screenshot({ path: `_artifacts/quote-${viewport.name}.jpg`, type: 'jpeg', quality: 90 });
      await page.locator('.contact-section').screenshot({ path: `_artifacts/contact-${viewport.name}.jpg`, type: 'jpeg', quality: 90 });
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    const headingVisible = await page.getByRole('heading', { name: /Ideas, made/i }).isVisible();
    const heroRoleLabel = await page.locator('.hero-copy .eyebrow').textContent();
    const mobileContentImmediate = !isMobile || await page.locator('.reveal').evaluateAll(elements => elements.every(element => {
      const style = getComputedStyle(element);
      const transformIsIdentity = style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)';
      return style.opacity === '1' && transformIsIdentity && style.transitionDuration.split(',').every(duration => Number.parseFloat(duration) === 0);
    }));
    const statusOpenToWork = await page.getByText('Open to Work', { exact: true }).isVisible();
    const servicesCollapsedInitially = await page.locator('.service-trigger').evaluateAll(triggers => triggers.every(trigger => trigger.getAttribute('aria-expanded') === 'false')) && await page.locator('.service-panel').evaluateAll(panels => panels.every(panel => panel.hidden));
    const mobileFontScale = !isMobile || await page.locator('body').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize) <= 15);
    const mobileQuoteLineCount = !isMobile ? 3 : await page.locator('.quote-section blockquote span').evaluateAll(spans => new Set(spans.map(span => Math.round(span.getBoundingClientRect().top))).size);
    const mobileContactHeadlineLineCount = !isMobile ? 2 : await page.locator('#contact-title').evaluate(element => new Set([...element.querySelectorAll('span')].map(span => Math.round(span.getBoundingClientRect().top))).size);
    const mobileContactLandEmphasis = !isMobile || await page.locator('#contact-title').evaluate(element => Number.parseFloat(getComputedStyle(element.querySelector('.contact-land')).fontSize) > Number.parseFloat(getComputedStyle(element.querySelector('.contact-lead')).fontSize));
    const heroImageCurrentSrc = await page.locator('.hero-picture img').evaluate(image => image.currentSrc);
    const heroLedeVisible = await page.locator('.hero-lede').isVisible();
    const heroEyebrowVisible = await page.locator('.hero-copy .eyebrow').isVisible();
    const heroStageHeight = await page.locator('.hero-stage').evaluate(element => Math.round(element.getBoundingClientRect().height));
    const heroActionGap = await page.evaluate(() => {
      const title = document.querySelector('.hero h1').getBoundingClientRect();
      const actions = document.querySelector('.hero-actions').getBoundingClientRect();
      return Math.round(actions.top - title.bottom);
    });
    const heroBottomGap = await page.evaluate(() => {
      const stage = document.querySelector('.hero-stage').getBoundingClientRect();
      const actions = document.querySelector('.hero-actions').getBoundingClientRect();
      return Math.round(stage.bottom - actions.bottom);
    });
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const projectCount = await page.locator('.project-card').count();
    const projectImagesWidescreen = await page.locator('.project-card .project-media').evaluateAll(elements => elements.length === 6 && elements.every(element => {
      const rect = element.getBoundingClientRect();
      return getComputedStyle(element).aspectRatio === '16 / 9' && Math.abs(rect.width / rect.height - 16 / 9) < .02;
    }));
    const mobileProjectImagesEager = !isMobile || await page.locator('.project-card img').evaluateAll(images => images.length === 6 && images.every(image => image.loading === 'eager'));
    const overallRatingVisible = await page.getByText('Overall rating', { exact: true }).isVisible();
    const exploreWorksVisible = await page.getByRole('link', { name: /Explore Works/i }).isVisible();
    const exploreIconIsFile = await page.getByRole('link', { name: /Explore Works/i }).locator('.action-icon-file').count() === 1;
    const viewAllProjectsButton = page.getByRole('link', { name: 'View all Projects', exact: true });
    const viewAllProjectsIsButton = await viewAllProjectsButton.isVisible() && await viewAllProjectsButton.evaluate(element => element.classList.contains('button'));
    const projectIconsValid = await page.locator('.project-card .arrow-button').evaluateAll(elements => elements.length === 6 && elements.every(element => {
      const pseudo = getComputedStyle(element, '::before');
      const rect = element.getBoundingClientRect();
      return pseudo.maskImage !== 'none' && rect.width >= 44 && rect.height >= 44;
    }));
    const viewAllProjectsWidthMatches = await page.evaluate(() => {
      const button = document.querySelector('.button-all-projects').getBoundingClientRect();
      const media = document.querySelector('.project-card .project-media').getBoundingClientRect();
      return Math.abs(button.width - media.width) <= 2;
    });
    const cvLink = page.getByRole('link', { name: /Download CV/i });
    const cvHref = await cvLink.getAttribute('href');
    const cvDownload = await cvLink.getAttribute('download');
    const cvResponse = await page.request.get(`${testUrl}${cvHref}`);
    const cvAvailable = cvResponse.ok() && (cvResponse.headers()['content-type'] || '').includes('application/pdf');
    const contactForm = page.locator('[data-contact-form]');
    const contactFormConnected = await contactForm.evaluate(form => form.action === 'https://api.web3forms.com/submit' && form.method.toLowerCase() === 'post' && form.querySelector('[name="access_key"]')?.value === '44e58263-9bb0-4c59-98ec-e9c82910ddf9' && ['name', 'email', 'message'].every(name => Boolean(form.querySelector(`[name="${name}"][required]`))));
    const contactFormLabelsValid = await contactForm.locator('.contact-field').evaluateAll(labels => labels.length === 3 && labels.every(label => Boolean(label.getAttribute('for')) && label.querySelector('span')?.textContent.trim().length > 0));
    const contactFormTouchFriendly = !isMobile || await contactForm.locator('input:not([type="hidden"]), textarea, button[type="submit"]').evaluateAll(elements => elements.every(element => element.getBoundingClientRect().height >= 44));
    await contactForm.locator('[name="name"]').fill('Portfolio Test');
    await contactForm.locator('[name="email"]').fill('test@example.com');
    await contactForm.locator('[name="message"]').fill('Testing the connected project enquiry form.');
    await contactForm.locator('button[type="submit"]').click();
    await page.locator('[data-contact-form-status]').getByText('Thanks. Your project brief has been sent.').waitFor();
    const contactSubmissionFeedback = await page.locator('[data-contact-form-status]').getAttribute('role') === 'status'
      && await contactForm.locator('[name="name"]').inputValue() === ''
      && !(await contactForm.locator('button[type="submit"]').isDisabled());
    const whatsapp = page.locator('.whatsapp-float');
    const whatsappHref = await whatsapp.getAttribute('href');
    const whatsappIconOnly = await whatsapp.evaluate(element => element.textContent.trim() === '' && Boolean(element.querySelector('svg')));
    const whatsappScrollStability = await page.evaluate(async () => {
      const element = document.querySelector('.whatsapp-float');
      const gaps = [];
      const sample = async y => {
        window.scrollTo(0, y);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        gaps.push(Math.round(window.innerHeight - element.getBoundingClientRect().bottom));
      };
      for (const y of [0, 320, 900, 1500, document.body.scrollHeight]) await sample(y);
      const style = getComputedStyle(element);
      return {
        range: Math.max(...gaps) - Math.min(...gaps),
        composited: style.willChange.includes('transform'),
        mobileShadowCompact: window.innerWidth > 620 || !style.boxShadow.includes('34px')
      };
    });
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
        withinViewport: rect.bottom <= window.innerHeight && rect.top >= 0,
        dynamicViewportAnchored: window.innerWidth > 620 || (Boolean(element.style.top) && element.style.bottom === 'auto'),
        computedTop: getComputedStyle(element).top,
        computedBottom: getComputedStyle(element).bottom,
        inlineTop: element.style.top,
        inlineBottom: element.style.bottom,
        viewportWidth: window.innerWidth
      };
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(450);

    if (isMobile) {
      await page.locator('.menu-toggle').click();
      const menuOpen = await page.locator('.mobile-menu').getAttribute('aria-hidden') === 'false';
      await page.keyboard.press('Escape');
      results.push({ page: 'home', viewport: viewport.name, errors, headingVisible, heroRoleLabel, mobileContentImmediate, statusOpenToWork, servicesCollapsedInitially, mobileFontScale, mobileQuoteLineCount, mobileContactHeadlineLineCount, mobileContactLandEmphasis, horizontalOverflow, projectCount, projectImagesWidescreen, mobileProjectImagesEager, menuOpen, whatsappHref, whatsappPosition, whatsappIconOnly, whatsappScrollStability, overallRatingVisible, exploreWorksVisible, exploreIconIsFile, viewAllProjectsIsButton, viewAllProjectsWidthMatches, projectIconsValid, cvHref, cvDownload, cvAvailable, contactFormConnected, contactFormLabelsValid, contactFormTouchFriendly, contactSubmissionFeedback, ogImage, twitterCard, heroImageCurrentSrc, heroLedeVisible, heroEyebrowVisible, heroStageHeight, heroActionGap, heroBottomGap });
    } else {
      await page.locator('.service-trigger').nth(1).click();
      await page.waitForTimeout(420);
      const secondServiceOpen = await page.locator('.service-trigger').nth(1).getAttribute('aria-expanded') === 'true';
      results.push({ page: 'home', viewport: viewport.name, errors, headingVisible, heroRoleLabel, mobileContentImmediate, statusOpenToWork, servicesCollapsedInitially, mobileFontScale, mobileQuoteLineCount, mobileContactHeadlineLineCount, mobileContactLandEmphasis, horizontalOverflow, projectCount, projectImagesWidescreen, mobileProjectImagesEager, secondServiceOpen, whatsappHref, whatsappPosition, whatsappIconOnly, whatsappScrollStability, overallRatingVisible, exploreWorksVisible, exploreIconIsFile, viewAllProjectsIsButton, viewAllProjectsWidthMatches, projectIconsValid, cvHref, cvDownload, cvAvailable, contactFormConnected, contactFormLabelsValid, contactFormTouchFriendly, contactSubmissionFeedback, ogImage, twitterCard, heroImageCurrentSrc, heroLedeVisible, heroEyebrowVisible, heroStageHeight, heroActionGap, heroBottomGap });
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
    const isMobile = viewport.width <= 620;
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${testUrl}/projects.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    if (viewport.name === 'mobile') await page.screenshot({ path: '_artifacts/projects-mobile-fold.jpg', type: 'jpeg', quality: 90 });

    const initialVisibleCount = await page.locator('.portfolio-card:not([hidden])').count();
    const visibleProjectImagesEager = await page.locator('.portfolio-card:not([hidden]) img').evaluateAll(images => images.length === 10 && images.every(image => image.loading === 'eager'));
    const projectsContentImmediate = viewport.name !== 'mobile' || await page.locator('.portfolio-card:not([hidden])').evaluateAll(cards => cards.every(card => {
      const style = getComputedStyle(card);
      const transformIsIdentity = style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)';
      return style.opacity === '1' && transformIsIdentity && style.transitionDuration.split(',').every(duration => Number.parseFloat(duration) === 0);
    }));
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
    const projectDisplayTitleScale = await page.evaluate(() => ({
      hero: Number.parseFloat(getComputedStyle(document.querySelector('.projects-hero h1')).fontSize),
      cta: Number.parseFloat(getComputedStyle(document.querySelector('.projects-cta h2')).fontSize)
    }));
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const projectCount = await page.locator('.portfolio-card').count();
    const uniqueLinks = await page.locator('.portfolio-card').evaluateAll(cards => new Set(cards.map(card => card.href)).size);
    const missingImages = await page.locator('.portfolio-image img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).length);
    const portfolioImagesWidescreen = await page.locator('.portfolio-image').evaluateAll(elements => elements.length === 52 && elements.every(element => getComputedStyle(element).aspectRatio === '16 / 9') && elements.filter(element => !element.closest('.portfolio-card').hidden).every(element => {
      const rect = element.getBoundingClientRect();
      return Math.abs(rect.width / rect.height - 16 / 9) < .02;
    }));
    const whatsappHref = await page.locator('.whatsapp-float').getAttribute('href');
    const portfolioIconsValid = await page.locator('.portfolio-meta i').evaluateAll(elements => elements.length === 52 && elements.every(element => getComputedStyle(element, '::before').maskImage !== 'none'));
    const behanceButton = page.getByRole('link', { name: 'Follow on Behance', exact: true });
    const behanceButtonValid = await behanceButton.isVisible() && await behanceButton.evaluate(element => {
      const logo = element.querySelector('.behance-mark svg');
      return element.classList.contains('button') && logo?.getAttribute('viewBox') === '0 0 24 24' && Boolean(logo.querySelector('path'));
    });
    const projectsLayoutAlignment = await page.evaluate(() => {
      const filters = document.querySelector(window.innerWidth <= 620 ? '.project-filter-trigger' : '.project-filters').getBoundingClientRect();
      const image = document.querySelector('.portfolio-card:not([hidden]) .portfolio-image').getBoundingClientRect();
      const grid = document.querySelector('.portfolio-grid').getBoundingClientRect();
      const reference = window.innerWidth <= 620 ? image : grid;
      return {
        leftDelta: Math.abs(filters.left - reference.left),
        rightDelta: Math.abs(filters.right - reference.right),
        withinViewport: filters.left >= 0 && filters.right <= window.innerWidth
      };
    });

    const chooseProjectFilter = async value => {
      if (!isMobile) return page.locator(`[data-project-filter="${value}"]`).click();
      await page.locator('[data-project-filter-trigger]').click();
      await page.locator(`[data-project-filter-option="${value}"]`).click();
    };
    const categoryOrder = await page.locator('[data-project-filter]').evaluateAll(buttons => buttons.map(button => button.dataset.projectFilter));
    const projectCategoryGroupOrder = await page.locator('.portfolio-card').evaluateAll(cards => cards.map(card => card.dataset.category).filter((category, index, categories) => index === 0 || category !== categories[index - 1]));
    const mobileFilterTriggerVisible = !isMobile || await page.locator('[data-project-filter-trigger]').isVisible();
    const nativeFilterSelectAbsent = await page.locator('[data-project-filter-select]').count() === 0;
    const desktopFilterButtonsVisible = isMobile || await page.locator('.project-filters').isVisible();
    let filterSheetAccessible = true;
    let filterSheetTouchTargets = true;
    let filterSheetFocusReturn = true;
    if (isMobile) {
      const trigger = page.locator('[data-project-filter-trigger]');
      await trigger.click();
      const sheet = page.locator('[data-project-filter-sheet]');
      await page.waitForTimeout(280);
      filterSheetAccessible = await sheet.isVisible()
        && await sheet.locator('[role="dialog"][aria-modal="true"]').count() === 1
        && await sheet.locator('[data-project-filter-option]').count() === 8
        && await sheet.locator('[data-project-filter-option="all"]').getAttribute('aria-pressed') === 'true';
      filterSheetTouchTargets = await sheet.locator('button').evaluateAll(buttons => buttons.every(button => {
        const rect = button.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44;
      }));
      await sheet.screenshot({ path: `_artifacts/projects-${viewport.name}-filter-open.jpg`, type: 'jpeg', quality: 90 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(240);
      filterSheetFocusReturn = await sheet.isHidden() && await trigger.evaluate(element => document.activeElement === element);
    }
    await chooseProjectFilter('pitch');
    const initialPitchCount = await page.locator('.portfolio-card:not([hidden])').count();
    await page.locator('[data-project-pagination] [aria-label="Page 2"]').click();
    const secondPitchPageCount = await page.locator('.portfolio-card:not([hidden])').count();
    await chooseProjectFilter('website');
    const initialWebsiteCount = await page.locator('.portfolio-card:not([hidden])').count();
    await page.locator('[data-project-pagination] [aria-label="Page 2"]').click();
    const secondWebsitePageCount = await page.locator('.portfolio-card:not([hidden])').count();
    await chooseProjectFilter('fiverr');
    const visibleFiverrCount = await page.locator('.portfolio-card:not([hidden])').count();
    const fiverrPaginationHidden = !(await page.locator('[data-project-pagination]').isVisible());
    const mobileFilterLabelUpdates = !isMobile || await page.locator('[data-project-filter-label]').evaluate(element => element.textContent.trim() === 'Fiverr picks 7');
    results.push({ page: 'projects', viewport: viewport.name, errors, headingVisible, projectsContentImmediate, projectDisplayTitleScale, horizontalOverflow, projectCount, uniqueLinks, missingImages, portfolioImagesWidescreen, initialVisibleCount, visibleProjectImagesEager, paginationVisibleInitially, initialPageCount, paginationGroups, initialCurrentPage, secondPageVisibleCount, secondPageCurrent, initialPitchCount, secondPitchPageCount, initialWebsiteCount, secondWebsitePageCount, visibleFiverrCount, fiverrPaginationHidden, whatsappHref, ogImage, twitterCard, behanceButtonValid, portfolioIconsValid, projectsLayoutAlignment, categoryOrder, projectCategoryGroupOrder, mobileFilterTriggerVisible, nativeFilterSelectAbsent, desktopFilterButtonsVisible, filterSheetAccessible, filterSheetTouchTargets, filterSheetFocusReturn, mobileFilterLabelUpdates });

    await chooseProjectFilter('all');
    for (const item of await page.locator('.reveal:not([hidden])').all()) {
      if (!(await item.isVisible())) continue;
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
    if (result.page === 'home') return result.heroRoleLabel?.trim() !== 'CREATIVE DESIGNER' || result.projectCount !== 6 || !result.projectImagesWidescreen || !result.mobileContentImmediate || !result.mobileProjectImagesEager || !result.statusOpenToWork || !result.servicesCollapsedInitially || !result.mobileFontScale || result.mobileQuoteLineCount !== 3 || result.mobileContactHeadlineLineCount !== 2 || !result.mobileContactLandEmphasis || result.menuOpen === false || result.secondServiceOpen === false || !result.whatsappPosition.visible || !result.whatsappPosition.rightAligned || !result.whatsappPosition.fixed || !result.whatsappPosition.withinViewport || !result.whatsappPosition.dynamicViewportAnchored || !result.whatsappIconOnly || result.whatsappScrollStability.range > 1 || !result.whatsappScrollStability.composited || !result.whatsappScrollStability.mobileShadowCompact || !result.exploreWorksVisible || !result.exploreIconIsFile || !result.viewAllProjectsIsButton || !result.projectIconsValid || result.cvHref !== '/assets/portfolio/Muhammed-Ishaque-CV.pdf' || result.cvDownload !== 'Muhammed-Ishaque-CV.pdf' || !result.cvAvailable || !result.contactFormConnected || !result.contactFormLabelsValid || !result.contactFormTouchFriendly || !result.contactSubmissionFeedback || (result.viewport !== 'desktop' ? !result.viewAllProjectsWidthMatches || result.overallRatingVisible || result.heroLedeVisible || result.heroEyebrowVisible || result.heroStageHeight > 502 || result.heroActionGap < 22 || result.heroActionGap > 26 || result.heroBottomGap < 16 || result.heroBottomGap > 20 || !result.heroImageCurrentSrc.endsWith('/assets/portfolio/ishaque-hero-mobile.png') : !result.overallRatingVisible || !result.heroLedeVisible || !result.heroEyebrowVisible || !result.heroImageCurrentSrc.endsWith('/assets/portfolio/ishaque-hero.png'));
    return result.projectCount !== 52 || result.uniqueLinks < 47 || result.missingImages !== 0 || !result.portfolioImagesWidescreen || !result.projectsContentImmediate || result.projectDisplayTitleScale.hero > (result.viewport === 'desktop' ? 92 : 46) || result.projectDisplayTitleScale.cta > (result.viewport === 'desktop' ? 92 : 46) || result.initialVisibleCount !== 10 || !result.visibleProjectImagesEager || !result.paginationVisibleInitially || result.initialPageCount !== (result.viewport === 'desktop' ? 6 : 4) || result.paginationGroups !== 3 || result.initialCurrentPage !== '1' || result.secondPageVisibleCount !== 10 || result.secondPageCurrent !== '2' || result.initialPitchCount !== 10 || result.secondPitchPageCount !== 2 || result.initialWebsiteCount !== 10 || result.secondWebsitePageCount !== 6 || result.visibleFiverrCount !== 7 || !result.fiverrPaginationHidden || !result.behanceButtonValid || !result.portfolioIconsValid || !result.projectsLayoutAlignment.withinViewport || result.projectsLayoutAlignment.leftDelta > 1 || result.projectsLayoutAlignment.rightDelta > 1 || result.categoryOrder.slice(0, 4).join(',') !== 'all,pitch,presentation,website' || result.projectCategoryGroupOrder.slice(0, 3).join(',') !== 'pitch,presentation,one-pager' || !result.mobileFilterTriggerVisible || !result.nativeFilterSelectAbsent || !result.desktopFilterButtonsVisible || !result.filterSheetAccessible || !result.filterSheetTouchTargets || !result.filterSheetFocusReturn || !result.mobileFilterLabelUpdates;
  });
  if (failed) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
