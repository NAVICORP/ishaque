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

/* ---------- valley: fly in on scroll, places on tap ---------- */
const valley = $('[data-valley]');
if (valley) {
  const stage = $('[data-stage]', valley);
  const pins = $$('.pin', valley);
  const flying = !reduced;

  const copy = $('[data-hero-copy]', valley);
  const overlaps = (a, b, pad = 10) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  const fitPins = () => {
    const box = stage.getBoundingClientRect();
    const copyBoxes = copy && Number(getComputedStyle(copy).opacity) > .35 ? [...copy.children].map(el => el.getBoundingClientRect()) : [];
    pins.forEach(pin => {
      const label = $('b', pin) || $('.me-note', pin) || pin;
      pin.style.removeProperty('--shift');
      const anchor = pin.getBoundingClientRect();
      const cx = anchor.left + anchor.width / 2;
      let off = cx < box.left + 4 || cx > box.right - 4;
      if (!off && $('b', pin)) {
        const r = label.getBoundingClientRect();
        let shift = 0;
        if (r.left < box.left + 10) shift = box.left + 10 - r.left;
        if (r.right > box.right - 10) shift = box.right - 10 - r.right;
        if (shift) pin.style.setProperty('--shift', `${shift}px`);
      }
      if (!off && copyBoxes.length) { const lr = label.getBoundingClientRect(); off = copyBoxes.some(b => overlaps(lr, b)); }
      pin.classList.toggle('is-off', off);
    });
  };

  let lastP = -1;
  onFrame.push(() => {
    if (!flying) return;
    const total = valley.offsetHeight - innerHeight;
    const p = total > 0 ? clamp(-valley.getBoundingClientRect().top / total, 0, 1) : 0;
    if (Math.abs(p - lastP) < .001) return;
    lastP = p;
    valley.style.setProperty('--p', p.toFixed(4));
    valley.style.setProperty('--cam', (1 + p * .42).toFixed(4));
    fitPins();
  });
  addEventListener('resize', fitPins);
  document.fonts?.ready.then(fitPins);
  fitPins();

  const PLACES = {
    delhi: {
      tag: 'New Delhi', title: 'New Delhi',
      text: 'My MA at Jamia Millia Islamia, then two years at Value360 Communications in Okhla, just down the road.',
      list: ['MA in Arabic, Jamia Millia Islamia', '2023 to 2025: Senior Presentation Designer, Value360', 'How companies pitch to clients and decision makers'],
    },
    calicut: {
      tag: 'Degree', title: 'University of Calicut',
      text: 'BA in Arabic. I studied languages, not design.',
    },
    home: {
      tag: '2020', title: 'Home, Blathur',
      text: 'Where SkiFi began: my first presentation orders on Fiverr, from home. Just me and PowerPoint: pitch decks, company profiles, anything with slides.',
      list: ['Repeat clients, then international work', 'Thousands of projects for clients in 40+ countries'],
    },
    me: {
      tag: "That's me", title: 'Ishaque Nv.',
      text: 'Founder of SkiFi. I design and build, and I work in English, Arabic, Hindi, Urdu, Malayalam and Tamil.',
      link: { href: '#contact', label: 'Say hello' },
    },
    skifi: {
      tag: 'Now', title: 'SkiFi',
      text: 'The studio I run from Kannur: about fifteen people making decks, brands, websites and apps, with presentations at the heart.',
      list: ['950+ clients', 'Fiverr Vetted Pro Agency since June 2026', 'Our own products, like FarmiLife'],
      link: { href: 'https://skifi.co', label: 'Visit skifi.co', external: true },
    },
    fiverr: {
      tag: '2025', title: 'Fiverr Vetted Pro',
      text: 'Vetted Pro for presentation design in August 2025, then for pitch decks. In June 2026 SkiFi became a Vetted Pro Agency.',
      list: ['900+ reviews, rated 4.9', '2,700+ projects delivered'],
      link: { href: 'https://www.fiverr.com/skifidesigns', label: 'See the Fiverr profile', external: true },
    },
    wyoming: {
      tag: 'LLC', title: 'SKIFI GROUP LLC',
      text: 'Registered in Wyoming, USA, so SkiFi works as an international company, not just a profile on a platform.',
    },
  };

  const sheet = $('[data-place-sheet]', valley);
  let openPin = null;
  const closePlace = () => {
    if (!openPin) return;
    openPin.setAttribute('aria-expanded', 'false');
    sheet.hidden = true;
    const last = openPin;
    openPin = null;
    return last;
  };
  const openPlace = pin => {
    const data = PLACES[pin.dataset.place];
    if (!data) return;
    if (openPin === pin) { closePlace(); return; }
    closePlace();
    $('[data-place-tag]', sheet).textContent = data.tag;
    $('[data-place-title]', sheet).textContent = data.title;
    $('[data-place-text]', sheet).textContent = data.text;
    const list = $('[data-place-list]', sheet);
    list.replaceChildren(...(data.list || []).map(t => Object.assign(document.createElement('li'), { textContent: t })));
    const link = $('[data-place-link]', sheet);
    link.hidden = !data.link;
    if (data.link) {
      link.href = data.link.href;
      link.textContent = data.link.label;
      if (data.link.external) { link.target = '_blank'; link.rel = 'noopener'; } else { link.removeAttribute('target'); }
    }
    pin.setAttribute('aria-expanded', 'true');
    openPin = pin;
    sheet.hidden = false;
  };
  pins.forEach(pin => pin.addEventListener('click', () => openPlace(pin)));
  $('[data-place-close]', sheet)?.addEventListener('click', () => closePlace()?.focus());
  $('[data-place-link]', sheet)?.addEventListener('click', () => closePlace());
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && openPin) closePlace()?.focus(); });
  stage.addEventListener('click', e => {
    if (openPin && !e.target.closest('.pin, .sheet')) closePlace();
  });
}

/* ---------- story: sticky notes you can move ---------- */
const notesBox = $('[data-notes]');
if (notesBox) {
  const canDrag = matchMedia('(min-width: 901px)');
  const hint = $('.move-hint', notesBox);
  let z = 3;
  $$('[data-note]', notesBox).forEach(note => {
    note.addEventListener('pointerdown', e => {
      if (!canDrag.matches || e.button !== 0) return;
      const box = notesBox.getBoundingClientRect();
      const r = note.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      note.setPointerCapture(e.pointerId);
      note.classList.add('is-drag');
      note.style.zIndex = String(++z);
      const move = ev => {
        const x = clamp(ev.clientX - box.left - dx, -40, box.width - r.width + 40);
        const y = clamp(ev.clientY - box.top - dy, -60, box.height - r.height + 40);
        note.style.left = `${x}px`;
        note.style.top = `${y}px`;
      };
      const up = () => {
        note.classList.remove('is-drag');
        note.removeEventListener('pointermove', move);
        hint?.classList.add('is-done');
      };
      note.addEventListener('pointermove', move);
      note.addEventListener('pointerup', up, { once: true });
      note.addEventListener('pointercancel', up, { once: true });
    });
  });
}

/* ---------- journey: fly the map, stop by stop ---------- */
const journey = $('[data-journey]');
if (journey) {
  const NS = 'http://www.w3.org/2000/svg';
  const view = $('[data-mapview]', journey);
  const svg = $('[data-map]', journey);
  const card = $('[data-jcard]', journey);
  const head = $('[data-j-head]', journey);
  const fade = $('[data-j-fade]', journey);
  const meDot = $('[data-me-dot]', journey);
  const needle = $('.needle', journey);
  const dots = $$('[data-j-go]', journey);
  const jtlLabel = $('[data-jtl-label]', journey);
  const esc = t => t.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const stops = $$('.j-stop', journey).map((li, i) => ({
    i, x: +li.dataset.x, y: +li.dataset.y, cluster: li.dataset.cluster, c: li.style.getPropertyValue('--c'),
    icon: $('.j-icon', li).innerHTML, place: $('.j-place', li).textContent, meta: $('.j-meta', li).textContent,
    when: $('.j-when', li).textContent, title: $('h3', li).textContent, text: $('.j-text', li).textContent,
    pic: li.dataset.pic || '',
  }));
  const N = stops.length;
  const leaders = new Set();
  const seenCluster = new Set();
  stops.forEach(s => { if (!seenCluster.has(s.cluster)) { seenCluster.add(s.cluster); leaders.add(s.i); } });
  const live = !reduced;
  if (live) journey.classList.add('is-map');

  /* the route: a faint dotted line for the whole trip, a solid one for the part walked */
  const routeG = $('[data-route]', journey);
  const curves = [];
  for (let i = 0; i < N - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const bend = (i % 2 ? 1 : -1) * Math.min(.24, 120 / len + .1);
    curves.push(`M${a.x} ${a.y}Q${(a.x + b.x) / 2 - dy * bend} ${(a.y + b.y) / 2 + dx * bend} ${b.x} ${b.y}`);
  }
  const path = (d, cls) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', cls);
    routeG.append(p);
    return p;
  };
  curves.forEach(d => path(d, 'r-base'));
  const segs = curves.map(d => {
    const cas = path(d, 'r-case');
    const done = path(d, 'r-done');
    const L = done.getTotalLength();
    [cas, done].forEach(p => { p.style.strokeDasharray = `${L} ${L + 1}`; p.style.strokeDashoffset = `${L}`; });
    return { cas, done, L, angle: 0 };
  });
  segs.forEach((s, i) => { s.angle = Math.atan2(stops[i + 1].x - stops[i].x, stops[i].y - stops[i + 1].y) * 180 / Math.PI; });

  /* pins and place names, positioned on screen every frame */
  const pinLayer = $('[data-pins-layer]', journey);
  const pins = stops.map(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mk';
    b.tabIndex = -1;
    b.style.setProperty('--c', s.c);
    b.innerHTML = `<span class="mk-head"><span>${s.icon}</span></span><span class="mk-name">${esc(s.place)}</span>`;
    b.addEventListener('click', () => goTo(s.i));
    pinLayer.append(b);
    return b;
  });
  const labels = $$('.m-label', journey).map(el => ({ el, x: +el.dataset.x, y: +el.dataset.y }));

  const INTRO = .7;
  const PER = 1;
  const TRAVEL = .55;
  const UNITS = INTRO + N * PER + .25;
  let W = 0;
  let H = 0;
  let overview = null;
  let cams = [];
  let zStop = 1;

  function layout() {
    W = view.clientWidth;
    H = view.clientHeight;
    const mobile = W < 760;
    journey.style.height = live ? `${Math.round(UNITS * H + H)}px` : '';
    const xs = stops.map(s => s.x);
    const ys = stops.map(s => s.y);
    const bx0 = Math.min(...xs) - 170;
    const bx1 = Math.max(...xs) + 170;
    const by0 = Math.min(...ys) - 190;
    const by1 = Math.max(...ys) + 110;
    const top = H * (mobile ? .44 : .42);
    const bottom = H * (mobile ? .82 : .9);
    const z0 = Math.min((W - 40) / (bx1 - bx0), (bottom - top) / (by1 - by0));
    overview = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, z: z0, fx: W / 2, fy: (top + bottom) / 2 };
    zStop = mobile ? clamp(W / 520, .62, .85) : clamp(H / 980, .72, 1.15);
    const cardRight = mobile ? 0 : card.offsetLeft + card.offsetWidth;
    const fx = mobile ? W / 2 : cardRight + (W - cardRight) / 2;
    const fy = mobile ? H * .3 : H * .52;
    cams = stops.map(s => ({ x: s.x, y: s.y, z: zStop, fx, fy }));
    lastKey = '';
    render();
  }

  const ease = t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  function fly(a, b, e, hop) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const k = hop ? Math.min(2.6, d / 650) : 0;
    const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e) / (1 + k * 4 * e * (1 - e));
    return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z, fx: a.fx + (b.fx - a.fx) * e, fy: a.fy + (b.fy - a.fy) * e };
  }

  let shown = -1;
  let swapTimer;
  function fillCard(i) {
    const s = stops[i];
    card.style.setProperty('--c', s.c);
    const pic = s.pic ? `<span class="jc-pic media"><img src="${s.pic}" alt="" loading="lazy"></span>` : '';
    card.innerHTML = `<div class="jc-in"><div class="jc-top"><span class="jc-tile">${s.icon}</span><p>${esc(s.place)}<span>${esc(s.meta)}</span></p><em>${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</em></div>${pic}<div class="jc-body"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></div>`;
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

  let lastKey = '';
  function render() {
    if (!W) return;
    const top = journey.getBoundingClientRect().top;
    const u = live ? clamp(-top / H, 0, UNITS) : 0;
    let cam = overview;
    let active = -1;
    let seg = -1;
    let e = 0;
    let arrived0 = false;
    if (u >= INTRO) {
      const v = u - INTRO;
      const i = Math.min(N - 1, Math.floor(v / PER));
      const t = clamp((v - i * PER) / TRAVEL, 0, 1);
      e = ease(t);
      cam = fly(i === 0 ? overview : cams[i - 1], cams[i], e, i > 0);
      active = t > .5 ? i : i - 1;
      seg = i - 1;
      arrived0 = i === 0 && t > .9;
    }
    const key = `${cam.x.toFixed(1)},${cam.y.toFixed(1)},${cam.z.toFixed(4)},${active},${seg},${e.toFixed(3)}`;
    if (key === lastKey) return;
    lastKey = key;

    const vx = cam.x - cam.fx / cam.z;
    const vy = cam.y - cam.fy / cam.z;
    svg.setAttribute('viewBox', `${vx.toFixed(2)} ${vy.toFixed(2)} ${(W / cam.z).toFixed(2)} ${(H / cam.z).toFixed(2)}`);
    const sx = x => (x - vx) * cam.z;
    const sy = y => (y - vy) * cam.z;

    const far = cam.z < zStop * .55;
    pins.forEach((pin, n) => {
      pin.style.transform = `translate3d(${sx(stops[n].x).toFixed(1)}px, ${sy(stops[n].y).toFixed(1)}px, 0)`;
      pin.classList.toggle('is-on', n === active);
      pin.classList.toggle('is-future', active >= 0 && n > active);
      pin.classList.toggle('is-hidden', far && !leaders.has(n) && n !== active);
    });
    labels.forEach(l => {
      const x = sx(l.x);
      const y = sy(l.y);
      l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    });

    segs.forEach((s, n) => {
      const p = n < seg ? 1 : n === seg ? e : 0;
      const off = `${(s.L * (1 - p)).toFixed(1)}`;
      s.done.style.strokeDashoffset = off;
      s.cas.style.strokeDashoffset = off;
    });

    let dot = null;
    if (seg >= 0) {
      const pt = segs[seg].done.getPointAtLength(segs[seg].L * e);
      dot = [pt.x, pt.y];
    } else if (arrived0) {
      dot = [stops[0].x, stops[0].y];
    }
    meDot.classList.toggle('is-on', Boolean(dot));
    if (dot) meDot.style.transform = `translate3d(${sx(dot[0]).toFixed(1)}px, ${(sy(dot[1]) - 0).toFixed(1)}px, 0)`;
    if (needle && seg >= 0) needle.style.transform = `rotate(${segs[seg].angle.toFixed(1)}deg)`;

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
  const nameEl = $('[data-deck-name]', deck);
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
    nameEl.textContent = p.name;
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

/* ---------- websites carousel ---------- */
const brandRow = $('[data-brand-row]');
if (brandRow) {
  const prog = $('[data-brand-prog]');
  const step = () => (brandRow.querySelector('.site')?.offsetWidth || 400) + 24;
  $('[data-brand-prev]')?.addEventListener('click', () => brandRow.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }));
  $('[data-brand-next]')?.addEventListener('click', () => brandRow.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }));
  const sync = () => {
    const max = brandRow.scrollWidth;
    prog?.style.setProperty('--w', `${clamp(((brandRow.scrollLeft + brandRow.clientWidth) / max) * 100, 8, 100)}%`);
  };
  brandRow.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();
  const siteSlugs = $$('.site', brandRow).map(a => a.dataset.slug);
  $$('.site', brandRow).forEach(a => a.addEventListener('click', e => {
    if (!plainClick(e)) return;
    if (openSheet(a.dataset.slug, siteSlugs)) e.preventDefault();
  }));
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
    const depth = { delhi: .35, calicut: .6, home: .6, me: 1.2, skifi: .9, fiverr: .35, wyoming: .5 };
    $$('.pin', stageEl).forEach((pin, i) => {
      pin.style.setProperty('--pi', String(i));
      pin.style.setProperty('--lm', String(depth[pin.dataset.place] || .5));
    });
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

  /* the story paragraph lights up word by word as you read */
  const tell = $('.tell');
  if (tell) {
    splitWords(tell, 'tw', '--ti');
    const words = $$('.tw', tell);
    let lit = -1;
    onFrame.push(() => {
      const r = tell.getBoundingClientRect();
      const start = innerHeight * .88;
      const span = innerHeight * .5 + r.height * .5;
      const n = Math.round(clamp((start - r.top) / span, 0, 1) * words.length);
      if (n === lit) return;
      lit = n;
      words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
    });
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
  group('.tell-box', '.note', 'anim-drop');
  group('.deck-stage', '.deck-card', 'anim-deal', true);
  group('.brand-row', '.site', 'anim-rise');
  group('.hats', 'li', 'anim-rise');
  group('.studio-stats', 'li', 'anim-rise');
  group('.chips', 'li', 'anim-pop');
  group('.tools', '.tool', 'anim-pop');
  group('.keys', '.kw', 'anim-pop');
  group('.work-grid', '.work-card:nth-child(-n+6)', 'anim-rise');
  $$('.sec-head, .brand-head, .hello h2, .hello-sub, .studio-grid h2, .deck-side, .employer, .brief').forEach(el => {
    el.classList.add('anim-rise');
    io.observe(el);
  });
  $$('.hl').forEach(el => { el.classList.add('anim-hl'); io.observe(el); });
  const line = $('.proc-line');
  if (line) {
    line.classList.add('anim-line');
    $$('.pnode', line).forEach((n, i) => n.style.setProperty('--ai', String(i)));
    io.observe(line);
  }

  /* numbers count up the first time they show */
  const countEls = [...$$('.studio-stats b'), $('.note-sun strong'), $('.note-sky strong')].filter(Boolean);
  countEls.forEach(el => {
    const m = el.textContent.match(/^(\D*)([\d,]+)(.*)$/);
    if (!m || m[2] === '2020') return;
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

  /* websites: drag the row with a mouse */
  const row = $('[data-brand-row]');
  if (row && matchMedia('(pointer: fine)').matches) {
    let down = null;
    row.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = { x: e.clientX, left: row.scrollLeft, moved: false };
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 6) { down.moved = true; row.classList.add('is-drag'); }
      if (down.moved) row.scrollLeft = down.left - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      const moved = down.moved;
      down = null;
      setTimeout(() => row.classList.remove('is-drag'), 0);
      if (moved) row.addEventListener('click', ev => ev.preventDefault(), { capture: true, once: true });
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
