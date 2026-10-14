import { PROJECTS } from './src/data/projects.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const bySlug = Object.fromEntries(PROJECTS.map(p => [p.slug, p]));
const root = document.documentElement;

/* one rAF-throttled scroll and resize loop for everything below */
const onFrame = [];
let queued = false;
function tick() {
  queued = false;
  onFrame.forEach(fn => fn());
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(tick);
}
addEventListener('scroll', queue, { passive: true });
addEventListener('resize', queue, { passive: true });

/* ---------- toast ---------- */
const toast = $('.toast');
let toastTimer;
function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
}

/* ---------- images: a calm fallback when a cover fails ---------- */
function watchImage(img) {
  const box = img.closest('.media');
  if (!box) return;
  const fail = () => box.classList.add('is-broken');
  if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
  img.addEventListener('error', fail, { once: true });
}
$$('.media img').forEach(watchImage);

/* ---------- day and night ---------- */
const themeButtons = $$('[data-theme-toggle]');
const themeMeta = $('meta[name="theme-color"]');
const dayMeta = themeMeta?.content;
function syncThemeUI() {
  const dark = root.dataset.theme === 'dark';
  themeButtons.forEach(btn => {
    btn.setAttribute('aria-label', dark ? 'Switch to day' : 'Switch to night');
    const word = $('[data-theme-word]', btn);
    if (word) word.textContent = dark ? 'Day' : 'Night';
  });
  if (themeMeta) themeMeta.content = dark ? '#0e1626' : dayMeta;
}
themeButtons.forEach(btn => btn.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  if (!reduced) {
    root.classList.add('theme-fade');
    setTimeout(() => root.classList.remove('theme-fade'), 950);
  }
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch {}
  syncThemeUI();
}));
syncThemeUI();

/* ---------- dock: the pill slides to the section you're in ---------- */
const dock = $('[data-dock]');
const dockInd = $('[data-dock-ind]');
function moveDockTo(link) {
  if (!dock || !dockInd) return;
  if (!link || link.offsetParent === null) { dockInd.style.opacity = '0'; return; }
  dockInd.style.opacity = '1';
  dockInd.style.width = `${link.offsetWidth}px`;
  dockInd.style.transform = `translateX(${link.offsetLeft - 7}px)`;
  $$('a', dock).forEach(a => a.classList.toggle('is-on', a === link));
}
if (dock) {
  const current = $('a[aria-current="page"]', dock);
  const sectionLinks = $$('[data-dock-link]', dock);
  const sections = sectionLinks.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  let active = current || sectionLinks[0];
  if (sections.length) {
    onFrame.push(() => {
      const mid = innerHeight * .45;
      let found = sectionLinks[0];
      sections.forEach((sec, i) => {
        const r = sec.getBoundingClientRect();
        if (r.top <= mid) found = sectionLinks[i];
      });
      if (found !== active) { active = found; moveDockTo(active); }
    });
  }
  const place = () => moveDockTo(active);
  document.fonts?.ready.then(place);
  addEventListener('resize', place);
  place();
}

/* ---------- valley: fly in on scroll ---------- */
const valley = $('[data-valley]');
if (valley && !reduced) {
  let lastP = -1;
  onFrame.push(() => {
    const total = valley.offsetHeight - innerHeight;
    const p = total > 0 ? clamp(-valley.getBoundingClientRect().top / total, 0, 1) : 0;
    if (Math.abs(p - lastP) < .001) return;
    lastP = p;
    valley.style.setProperty('--p', p.toFixed(4));
    valley.style.setProperty('--cam', (1 + p * .42).toFixed(4));
  });
}

/* ---------- journey: drive the road, stop by stop ---------- */
const journey = $('[data-journey]');
if (journey) {
  const NS = 'http://www.w3.org/2000/svg';
  const view = $('[data-mapview]', journey);
  const svg = $('[data-map]', journey);
  const road = $('#road', svg);
  const card = $('[data-jcard]', journey);
  const head = $('[data-j-head]', journey);
  const fade = $('[data-j-fade]', journey);
  const meDot = $('[data-me-dot]', journey);
  const needle = $('.needle', journey);
  const dots = $$('[data-j-go]', journey);
  const jtlLabel = $('[data-jtl-label]', journey);
  const esc = t => t.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const L = road.getTotalLength();
  const at = len => road.getPointAtLength(clamp(len, 0, L));
  const stops = $$('.j-stop', journey).map((li, i) => {
    const len = L * Number(li.dataset.t);
    const p = at(len);
    return {
      i, len, x: p.x, y: p.y, c: li.style.getPropertyValue('--c'),
      icon: $('.j-icon', li).innerHTML, place: $('.j-place', li).textContent, meta: $('.j-meta', li).textContent,
      when: $('.j-when', li).textContent, title: $('h3', li).textContent, text: $('.j-text', li).textContent,
      pic: li.dataset.pic || '', mark: li.dataset.landmark || '', logo: li.dataset.logo || '', logoFull: li.dataset.logoFull || '',
    };
  });
  const N = stops.length;
  const live = !reduced;
  if (live) journey.classList.add('is-map');

  /* the walked part of the road, drawn over it in blue */
  const routeG = $('[data-route]', journey);
  const done = document.createElementNS(NS, 'path');
  done.setAttribute('d', road.getAttribute('d'));
  done.setAttribute('class', 'r-done');
  done.style.strokeDasharray = `${L} ${L + 1}`;
  done.style.strokeDashoffset = `${L}`;
  routeG.append(done);

  /* little landmarks beside each stop, on the side away from the pin's label */
  const marks = document.createElementNS(NS, 'g');
  marks.setAttribute('class', 'landmarks');
  const place = (href, x, y, size) => {
    const img = document.createElementNS(NS, 'image');
    img.setAttribute('href', href);
    img.setAttribute('x', (x - size / 2).toFixed(0));
    img.setAttribute('y', (y - size / 2).toFixed(0));
    img.setAttribute('width', size);
    img.setAttribute('height', size);
    marks.append(img);
  };
  stops.forEach(s => {
    if (!s.mark) return;
    const a = at(s.len - 8);
    const b = at(s.len + 8);
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const k = Math.hypot(tx, ty) || 1;
    let nx = -ty / k;
    let ny = tx / k;
    if (-nx + ny * .6 < 0) { nx = -nx; ny = -ny; }
    place(s.mark, s.x + nx * 175, s.y + ny * 175, 230);
  });
  place('/assets/map/boat.webp', 1290, 1215, 170);
  place('/assets/map/mountains.webp', 1830, 2230, 260);
  svg.insertBefore(marks, routeG.nextSibling);

  const pinLayer = $('[data-pins-layer]', journey);
  const pins = stops.map(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mk';
    b.tabIndex = -1;
    b.style.setProperty('--c', s.c);
    const name = s.logo ? `<span class="mk-name mk-name-logo"><img src="${s.logo}" alt="${esc(s.place)}"></span>` : `<span class="mk-name">${esc(s.place)}</span>`;
    b.innerHTML = `<span class="mk-head"><span>${s.icon}</span></span>${name}`;
    b.addEventListener('click', () => goTo(s.i));
    pinLayer.append(b);
    return b;
  });

  const INTRO = .7;
  const PER = 1;
  const TRAVEL = .55;
  const UNITS = INTRO + N * PER + .25;
  let W = 0;
  let H = 0;
  let overview = null;
  let cams = [];
  let zStop = 1;
  let lastKey = '';

  function layout() {
    W = view.clientWidth;
    H = view.clientHeight;
    const mobile = W < 760;
    journey.style.height = live ? `${Math.round(UNITS * H + H)}px` : '';
    const xs = stops.map(s => s.x);
    const ys = stops.map(s => s.y);
    const bx0 = Math.min(...xs) - 150;
    const bx1 = Math.max(...xs) + 220;
    const by0 = Math.min(...ys) - 130;
    const by1 = Math.max(...ys) + 80;
    const top = H * (mobile ? .44 : .42);
    const bottom = H - (mobile ? 150 : 160);
    const z0 = Math.min((W - 40) / (bx1 - bx0), (bottom - top) / (by1 - by0));
    overview = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, z: z0, fx: W / 2, fy: (top + bottom) / 2 };
    zStop = mobile ? clamp(W / 560, .58, .8) : clamp(H / 1000, .7, 1.05);
    const cardRight = mobile ? 0 : card.offsetLeft + card.offsetWidth;
    const fx = mobile ? W * .36 : cardRight + (W - cardRight) / 2;
    const fy = mobile ? H * .3 : H * .52;
    cams = stops.map(s => ({ x: s.x, y: s.y, z: zStop, fx, fy }));
    lastKey = '';
    render();
  }

  const ease = t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const mix = (a, b, e) => a + (b - a) * e;

  let shown = -1;
  let swapTimer;
  function fillCard(i) {
    const s = stops[i];
    card.style.setProperty('--c', s.c);
    const pic = s.pic ? `<span class="jc-pic media"><img src="${s.pic}" alt="" loading="lazy"></span>` : '';
    const who = s.logoFull ? `<p class="jc-brand"><img src="${s.logoFull}" alt="${esc(s.place)}"><span>${esc(s.meta)}</span></p>` : `<span class="jc-tile">${s.icon}</span><p>${esc(s.place)}<span>${esc(s.meta)}</span></p>`;
    card.innerHTML = `<div class="jc-in"><div class="jc-top">${who}<em>${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</em></div>${pic}<div class="jc-body"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></div>`;
  }
  function showCard(i) {
    if (i === shown) return;
    const first = shown < 0;
    shown = i;
    clearTimeout(swapTimer);
    if (i < 0) { card.classList.remove('is-on'); return; }
    if (first) { fillCard(i); card.classList.add('is-on'); return; }
    card.classList.add('is-swap');
    swapTimer = setTimeout(() => { fillCard(shown); card.classList.remove('is-swap'); }, 200);
  }

  function render() {
    if (!W) return;
    const top = journey.getBoundingClientRect().top;
    const u = live ? clamp(-top / H, 0, UNITS) : 0;
    let cam = overview;
    let active = -1;
    let walked = 0;
    let dot = null;
    if (u >= INTRO) {
      const v = u - INTRO;
      const i = Math.min(N - 1, Math.floor(v / PER));
      const e = ease(clamp((v - i * PER) / TRAVEL, 0, 1));
      active = e > .5 ? i : i - 1;
      if (i === 0) {
        cam = { x: mix(overview.x, cams[0].x, e), y: mix(overview.y, cams[0].y, e), z: Math.exp(mix(Math.log(overview.z), Math.log(zStop), e)), fx: mix(overview.fx, cams[0].fx, e), fy: mix(overview.fy, cams[0].fy, e) };
        walked = stops[0].len;
        dot = e > .85 ? at(walked) : null;
      } else {
        walked = mix(stops[i - 1].len, stops[i].len, e);
        const p = at(walked);
        dot = p;
        const lift = 1 + .5 * 4 * e * (1 - e);
        cam = { x: p.x, y: p.y, z: zStop / lift, fx: cams[i].fx, fy: cams[i].fy };
      }
    }
    const key = `${cam.x.toFixed(1)},${cam.y.toFixed(1)},${cam.z.toFixed(4)},${active},${walked.toFixed(1)}`;
    if (key === lastKey) return;
    lastKey = key;

    const vx = cam.x - cam.fx / cam.z;
    const vy = cam.y - cam.fy / cam.z;
    svg.setAttribute('viewBox', `${vx.toFixed(2)} ${vy.toFixed(2)} ${(W / cam.z).toFixed(2)} ${(H / cam.z).toFixed(2)}`);
    const sx = x => (x - vx) * cam.z;
    const sy = y => (y - vy) * cam.z;

    pins.forEach((pin, n) => {
      pin.style.transform = `translate3d(${sx(stops[n].x).toFixed(1)}px, ${sy(stops[n].y).toFixed(1)}px, 0)`;
      pin.classList.toggle('is-on', n === active);
      pin.classList.toggle('is-future', active >= 0 && n > active);
    });
    done.style.strokeDashoffset = `${(L - walked).toFixed(1)}`;

    meDot.classList.toggle('is-on', Boolean(dot));
    if (dot) {
      meDot.style.transform = `translate3d(${sx(dot.x).toFixed(1)}px, ${sy(dot.y).toFixed(1)}px, 0)`;
      if (needle) {
        const a = at(walked - 6);
        const b = at(walked + 6);
        needle.style.transform = `rotate(${(Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI).toFixed(1)}deg)`;
      }
    }

    const headOp = live ? 1 - clamp((u - .12) / .4, 0, 1) : 1;
    head.style.opacity = headOp.toFixed(3);
    head.style.transform = `translateX(-50%) translateY(${((1 - headOp) * -30).toFixed(1)}px)`;
    fade.style.opacity = headOp.toFixed(3);

    if (live) showCard(active);
    dots.forEach((d, n) => {
      d.classList.toggle('is-on', n === active);
      d.classList.toggle('is-done', n < active);
      if (n === active) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    if (jtlLabel) jtlLabel.textContent = active >= 0 ? stops[active].when : 'Degree to now';
  }

  function goTo(i) {
    const start = journey.getBoundingClientRect().top + scrollY;
    const y = start + (INTRO + i * PER + TRAVEL + .15) * H;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.jGo)));

  onFrame.push(render);
  addEventListener('resize', layout);
  document.fonts?.ready.then(layout);
  layout();
}

/* ---------- project sheet (quick view) ---------- */
const qv = $('[data-quick-view]');
let qvList = [];
let qvIndex = 0;
function link(href, label, cls, external = true) {
  const a = document.createElement('a');
  a.href = href;
  a.className = cls;
  a.textContent = label;
  if (external) { a.target = '_blank'; a.rel = 'noopener'; }
  return a;
}
function fillSheet(p) {
  $('[data-qv-tag]', qv).textContent = p.category;
  const media = $('[data-qv-media]', qv);
  media.classList.remove('is-broken');
  media.dataset.initial = p.name.charAt(0);
  const img = document.createElement('img');
  img.src = p.cover;
  img.alt = p.name;
  media.replaceChildren(img);
  watchImage(img);
  $('[data-qv-title]', qv).textContent = p.name;
  const role = [p.client && p.client !== p.name && !p.client.startsWith(p.name) ? p.client : '', p.industry, p.nda ? 'Under NDA' : ''].filter(Boolean).join(', ');
  const roleEl = $('[data-qv-role]', qv);
  roleEl.textContent = role;
  roleEl.hidden = !role;
  $('[data-qv-summary]', qv).textContent = p.headline && p.summary ? `${p.headline}. ${p.summary}` : (p.summary || p.headline);
  $('[data-qv-outcome]', qv).replaceChildren(...p.outcome.map(t => Object.assign(document.createElement('li'), { textContent: t })));
  const actions = [];
  if (p.fiverr) actions.push(link(p.href, 'View on Fiverr', 'btn-ink'));
  else actions.push(link(p.href, p.nda ? 'See it on skifi.co' : 'Read the case study', 'btn-ink'));
  if (p.live) actions.push(link(p.live, 'Visit the site', 'btn-ghost'));
  if (p.behance) actions.push(link(p.behance, 'Behance', 'btn-ghost'));
  $('[data-qv-actions]', qv).replaceChildren(...actions);
  const single = qvList.length < 2;
  $('[data-qv-prev]', qv).hidden = single;
  $('[data-qv-next]', qv).hidden = single;
}
function openSheet(slug, list) {
  if (!qv || !bySlug[slug]) return false;
  qvList = list && list.length ? list : [slug];
  qvIndex = Math.max(0, qvList.indexOf(slug));
  fillSheet(bySlug[slug]);
  if (!qv.open) qv.showModal();
  qv.scrollTop = 0;
  return true;
}
function stepSheet(dir) {
  qvIndex = (qvIndex + dir + qvList.length) % qvList.length;
  fillSheet(bySlug[qvList[qvIndex]]);
  qv.scrollTop = 0;
}
if (qv) {
  $('[data-qv-close]', qv).addEventListener('click', () => qv.close());
  $('[data-qv-prev]', qv).addEventListener('click', () => stepSheet(-1));
  $('[data-qv-next]', qv).addEventListener('click', () => stepSheet(1));
  qv.addEventListener('click', e => { if (e.target === qv) qv.close(); });
  qv.addEventListener('keydown', e => {
    if (e.target.closest('a, button')) return;
    if (e.key === 'ArrowRight') stepSheet(1);
    if (e.key === 'ArrowLeft') stepSheet(-1);
  });
}
const plainClick = e => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);

/* ---------- selected work: the deck ---------- */
const deck = $('[data-deck]');
if (deck) {
  const cards = $$('.deck-card', deck);
  const slugs = cards.map(c => c.dataset.slug);
  const sumEl = $('[data-deck-summary]', deck);
  const idxEl = $('[data-deck-index]', deck);
  $('[data-deck-total]', deck).textContent = String(cards.length);
  let front = 0;
  let busy = false;

  const render = () => {
    cards.forEach((card, n) => {
      const i = (n - front + cards.length) % cards.length;
      card.style.setProperty('--i', String(i));
      card.dataset.depth = i === 0 ? 'front' : i > 3 ? 'far' : 'back';
      card.tabIndex = i === 0 ? 0 : -1;
      card.setAttribute('aria-hidden', String(i !== 0));
    });
    const p = bySlug[slugs[front]];
    sumEl.textContent = p.summary;
    idxEl.textContent = String(front + 1);
  };
  const go = dir => {
    if (busy) return;
    if (dir > 0 && !reduced) {
      busy = true;
      const leaving = cards[front];
      leaving.classList.add('is-out');
      setTimeout(() => {
        front = (front + 1) % cards.length;
        leaving.classList.remove('is-out');
        render();
        busy = false;
      }, 300);
    } else {
      front = (front + dir + cards.length) % cards.length;
      render();
    }
  };
  $('[data-deck-next]', deck).addEventListener('click', () => go(1));
  $('[data-deck-prev]', deck).addEventListener('click', () => go(-1));
  $('[data-deck-open]', deck).addEventListener('click', () => openSheet(slugs[front], slugs));
  cards.forEach(card => card.addEventListener('click', e => {
    if (!plainClick(e)) return;
    if (openSheet(card.dataset.slug, slugs)) e.preventDefault();
  }));

  const stage = $('[data-deck-stage]', deck);
  let startX = null;
  stage.addEventListener('pointerdown', e => { startX = e.clientX; });
  stage.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) { stage.dataset.swiped = '1'; go(dx < 0 ? 1 : -1); }
  });
  stage.addEventListener('click', e => {
    if (stage.dataset.swiped) { e.preventDefault(); delete stage.dataset.swiped; }
  }, true);
  deck.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  render();
}

/* ---------- contact: press a key ---------- */
const keyLinks = Object.fromEntries($$('[data-key]').map(a => [a.dataset.key, a]));
if (Object.keys(keyLinks).length) {
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    const t = e.target;
    if (t.closest('input, textarea, select, [contenteditable="true"]') || qv?.open) return;
    const a = keyLinks[e.key.toLowerCase()];
    if (!a) return;
    a.classList.add('is-pressed');
    setTimeout(() => a.classList.remove('is-pressed'), 160);
    setTimeout(() => a.click(), 120);
  });
}

/* ---------- contact form ---------- */
const form = $('[data-contact-form]');
if (form) {
  const button = $('button[type="submit"]', form);
  const label = $('[data-submit-label]', form);
  const status = $('[data-form-status]', form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    button.disabled = true;
    label.textContent = 'Sending';
    status.className = 'form-status';
    status.textContent = '';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || 'The brief did not send. Email ishaque@skifi.co instead.');
      form.reset();
      status.classList.add('is-success');
      status.textContent = 'Thanks. Your brief has been sent.';
      showToast('Brief sent');
      flyPlane(button);
    } catch (err) {
      status.classList.add('is-error');
      status.setAttribute('role', 'alert');
      status.textContent = err.message || 'The brief did not send. Email ishaque@skifi.co instead.';
    } finally {
      button.disabled = false;
      label.textContent = 'Send brief';
    }
  });
}

/* ---------- projects page: filter, search, show more ---------- */
const grid = $('[data-grid]');
if (grid) {
  const cards = $$('.work-card', grid);
  const chips = $$('[data-filter]');
  const search = $('[data-search]');
  const more = $('[data-more]');
  const statusEl = $('[data-grid-status]');
  const empty = $('[data-empty]');
  const PAGE = 12;
  let filter = 'all';
  let shown = PAGE;
  let matches = cards;
  let applied = false;

  const fromHash = () => {
    const h = location.hash.slice(1);
    return chips.some(c => c.dataset.filter === h) ? h : 'all';
  };
  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    matches = cards.filter(c => (filter === 'all' || c.dataset.category === filter) && (!q || c.dataset.keywords.includes(q)));
    cards.forEach(c => { c.hidden = true; });
    matches.slice(0, shown).forEach((c, i) => {
      const fresh = c.hidden;
      c.hidden = false;
      if (fresh && !reduced && applied) {
        c.style.setProperty('--i', String(i % PAGE));
        c.classList.remove('is-new');
        void c.offsetWidth;
        c.classList.add('is-new');
      }
    });
    applied = true;
    const total = matches.length;
    const visible = Math.min(shown, total);
    more.hidden = visible >= total;
    more.textContent = `Show ${Math.min(PAGE, total - visible)} more`;
    empty.hidden = total > 0;
    statusEl.textContent = total ? `Showing ${visible} of ${total}` : '';
    chips.forEach(c => {
      const on = c.dataset.filter === filter;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
  };
  const setFilter = (value, push = true) => {
    filter = value;
    shown = PAGE;
    if (push) history.replaceState(null, '', value === 'all' ? location.pathname : `#${value}`);
    apply();
  };
  chips.forEach(c => c.addEventListener('click', () => setFilter(c.dataset.filter)));
  search?.addEventListener('input', () => { shown = PAGE; apply(); });
  more.addEventListener('click', () => {
    const first = matches[shown];
    shown += PAGE;
    apply();
    first?.focus({ preventScroll: true });
  });
  addEventListener('hashchange', () => setFilter(fromHash(), false));
  cards.forEach(card => card.addEventListener('click', e => {
    if (!plainClick(e)) return;
    if (openSheet(card.dataset.slug, matches.map(c => c.dataset.slug))) e.preventDefault();
  }));
  setFilter(fromHash(), false);
}

/* ---------- motion ---------- */
function splitWords(el, cls, varName) {
  let n = 0;
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const span = document.createElement('span');
          span.className = cls;
          span.textContent = part;
          span.style.setProperty(varName, String(n++));
          frag.append(span);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && ch.tagName !== 'BR') {
        walk(ch);
      }
    });
  };
  walk(el);
  return n;
}

function flyPlane(from) {
  if (reduced || !from) return;
  const r = from.getBoundingClientRect();
  const plane = document.createElement('span');
  plane.className = 'paper-plane';
  plane.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 18-7-7 18-2.6-7.4Z"/></svg>';
  plane.style.left = `${r.left + r.width / 2 - 17}px`;
  plane.style.top = `${r.top - 10}px`;
  document.body.append(plane);
  setTimeout(() => plane.remove(), 1500);
}

if (!reduced) {
  /* the valley assembles itself, then follows the pointer a little */
  const stageEl = $('[data-stage]');
  if (stageEl) {
    const h1 = $('#hero-title', stageEl);
    if (h1) splitWords(h1, 'w', '--wi');
    stageEl.classList.add('is-pre');
    const skies = $$('.ly-sky img', stageEl);
    const ready = Promise.race([
      Promise.all(skies.map(img => (img.decode ? img.decode().catch(() => {}) : null))),
      new Promise(r => setTimeout(r, 1400)),
    ]);
    ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => stageEl.classList.remove('is-pre'))));

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let tx = 0; let ty = 0; let mx = 0; let my = 0; let raf = 0;
      const step = () => {
        mx += (tx - mx) * .08;
        my += (ty - my) * .08;
        stageEl.style.setProperty('--mx', mx.toFixed(3));
        stageEl.style.setProperty('--my', my.toFixed(3));
        raf = Math.abs(tx - mx) + Math.abs(ty - my) > .002 ? requestAnimationFrame(step) : 0;
      };
      stageEl.addEventListener('pointermove', e => {
        const r = stageEl.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - .5) * 2;
        ty = ((e.clientY - r.top) / r.height - .5) * 2;
        if (!raf) raf = requestAnimationFrame(step);
      });
      stageEl.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(step); });
    }
  }

  /* entrances */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      io.unobserve(el);
      setTimeout(() => {
        $$('.anim-rise, .anim-pop, .anim-drop, .anim-deal', el).forEach(child => child.classList.remove('anim-rise', 'anim-pop', 'anim-drop', 'anim-deal'));
        el.classList.remove('anim-rise', 'anim-pop', 'anim-drop', 'anim-deal');
      }, 2600);
      el.dispatchEvent(new CustomEvent('enter'));
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  const group = (boxSel, itemSel, cls, reverse = false) => {
    $$(boxSel).forEach(box => {
      const items = $$(itemSel, box);
      items.forEach((el, i) => {
        el.classList.add(cls);
        el.style.setProperty('--ai', String(reverse ? items.length - 1 - i : i));
      });
      io.observe(box);
    });
  };
  group('.notes', '.note', 'anim-drop');
  group('.deck-stage', '.deck-card', 'anim-deal', true);
  group('.studio-stats', 'li', 'anim-rise');
  group('.tools', '.tool', 'anim-pop');
  group('.keys', '.kw', 'anim-pop');
  group('.work-grid', '.work-card:nth-child(-n+6)', 'anim-rise');
  $$('.sec-head, .proof h2, .hello h2, .hello-sub, .studio-grid h2, .deck-side, .brief').forEach(el => {
    el.classList.add('anim-rise');
    io.observe(el);
  });
  $$('.hl').forEach(el => { el.classList.add('anim-hl'); io.observe(el); });

  /* numbers count up the first time they show */
  const countEls = [...$$('.studio-stats b'), ...$$('.note strong')].filter(Boolean);
  countEls.forEach(el => {
    const m = el.textContent.match(/^(\D*)([\d,]+)(.*)$/);
    if (!m || m[2] === '2020' || m[3].startsWith('.')) return;
    const target = Number(m[2].replace(/,/g, ''));
    const commas = m[2].includes(',');
    const fmt = v => `${m[1]}${commas ? v.toLocaleString('en-US') : v}${m[3]}`;
    el.textContent = fmt(0);
    const obs = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now();
      const tickCount = now => {
        const k = clamp((now - t0) / 1400, 0, 1);
        el.textContent = fmt(Math.round(target * (1 - (1 - k) ** 4)));
        if (k < 1) requestAnimationFrame(tickCount);
      };
      requestAnimationFrame(tickCount);
    }, { threshold: .6 });
    obs.observe(el);
  });

  /* the front deck card tilts under the pointer */
  const stage = $('[data-deck-stage]');
  if (stage && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('pointermove', e => {
      const card = $('.deck-card[data-depth="front"]', stage);
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    });
    stage.addEventListener('pointerleave', () => {
      $$('.deck-card', stage).forEach(card => {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
  }

  /* the keyboard types its own shortcuts once when it comes into view */
  const keys = $('.keys');
  if (keys) {
    keys.addEventListener('enter', () => {
      $$('.kw', keys).forEach((k, i) => {
        setTimeout(() => {
          k.classList.add('is-pressed');
          setTimeout(() => k.classList.remove('is-pressed'), 170);
        }, 900 + i * 160);
      });
    }, { once: true });
  }
}

queue();
