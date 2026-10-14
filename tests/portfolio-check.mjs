/*
 * Smoke test for the built site.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm i --no-save playwright && npx playwright install chromium
 *   PORTFOLIO_URL=http://127.0.0.1:4173 npm run check
 */
import { chromium } from 'playwright';
import { PROJECTS } from '../src/data/projects.js';

const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173';
const failures = [];
const check = (ok, label) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) failures.push(label); };

const browser = await chromium.launch();
for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  await ctx.route('https://api.web3forms.com/submit', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(`${base}/`, { waitUntil: 'load' });
  check(await page.getByRole('heading', { level: 1 }).isVisible(), `${vp.name}: hero headline visible`);
  check(await page.locator('.deck-card').count() === 8, `${vp.name}: 8 cards in the selected work deck`);
  check(await page.locator('.client-logos').first().locator('img').count() === 16, `${vp.name}: all client logos in the row`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${vp.name}: no sideways scroll on home`);

  await page.locator('[data-theme-toggle]').click();
  check(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', `${vp.name}: night mode switches on`);
  await page.locator('[data-theme-toggle]').click();

  // The wall and visitor count only appear when the SkiFi server's /api answers.
  const hasApi = await page.evaluate(() => fetch('/api/stats').then(r => r.ok && (r.headers.get('content-type') || '').includes('json')).catch(() => false));
  await page.waitForTimeout(400);
  check(await page.locator('#wall').evaluate(el => !el.hidden) === hasApi, `${vp.name}: wall ${hasApi ? 'shows with' : 'stays hidden without'} the API`);
  if (hasApi) {
    await page.route('**/api/notes', r => r.request().method() === 'POST'
      ? r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ note: { id: 'test-note-1', name: 'Tester', work: '', message: 'Hello from the test.', avatar: 2, at: new Date().toISOString() } }) })
      : r.continue());
    const wf = page.locator('[data-wall-form]');
    await wf.scrollIntoViewIfNeeded();
    await wf.locator('#wall-name').fill('Tester');
    await wf.locator('#wall-msg').fill('Hello from the test.');
    await wf.locator('button[type="submit"]').click();
    await page.locator('[data-wall-status].is-success').waitFor({ timeout: 4000 }).catch(() => {});
    check(await page.locator('.wall-note').first().textContent().then(t => t.includes('Hello from the test.')), `${vp.name}: a note pins to the wall`);
  }

  const jTop = await page.evaluate(() => document.querySelector('#journey').getBoundingClientRect().top + scrollY);
  await page.evaluate(y => window.scrollTo(0, y + innerHeight * 1.4), jTop);
  await page.waitForTimeout(700);
  check(await page.locator('[data-jcard].is-on').count() === 1, `${vp.name}: the journey card opens on the road`);

  await page.locator('#work').scrollIntoViewIfNeeded();
  const first = await page.locator('[data-deck-index]').textContent();
  await page.locator('[data-deck-next]').click();
  await page.waitForTimeout(450);
  check(await page.locator('[data-deck-index]').textContent() !== first, `${vp.name}: deck moves to the next card`);
  await page.locator('[data-deck-open]').click();
  check(await page.locator('[data-quick-view]').isVisible(), `${vp.name}: deck opens the project sheet`);
  await page.locator('[data-qv-close]').click();

  const form = page.locator('[data-contact-form]');
  await form.locator('[name="name"]').fill('Test');
  await form.locator('[name="email"]').fill('test@example.com');
  await form.locator('[name="message"]').fill('Testing the brief form.');
  await form.locator('button[type="submit"]').click();
  await page.locator('[data-form-status].is-success').waitFor({ timeout: 4000 }).catch(() => {});
  check(await page.locator('[data-form-status].is-success').count() === 1, `${vp.name}: brief form sends`);

  await page.goto(`${base}/projects`, { waitUntil: 'load' });
  check(await page.locator('.work-card').count() === PROJECTS.length, `${vp.name}: all ${PROJECTS.length} projects on the projects page`);
  check(await page.locator('.work-card:not([hidden])').count() === 12, `${vp.name}: first 12 shown`);
  await page.locator('[data-filter="websites"]').click();
  check(await page.locator('.work-card:not([hidden])').count() === 12 && page.url().endsWith('#websites'), `${vp.name}: website filter and shareable hash`);
  await page.locator('[data-search]').fill('lenovo');
  await page.locator('[data-filter="all"]').click();
  check(await page.locator('.work-card:not([hidden])').count() >= 1, `${vp.name}: search finds Lenovo`);
  await page.locator('.work-card:not([hidden])').first().click();
  check(await page.locator('[data-quick-view]').isVisible(), `${vp.name}: a project card opens the sheet`);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${vp.name}: no sideways scroll on projects`);

  check(errors.length === 0, `${vp.name}: no script errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await ctx.close();
}
await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll checks passed');
