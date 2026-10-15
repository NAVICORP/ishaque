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

/* ---------- journey: drive the road, stop by stop ----------
 * The map is drawn into one canvas each frame from the shapes in the inline
 * SVG (read once, then the SVG is dropped). Repainting a big SVG on every
 * scroll frame was what made the map stutter on phones. */
const journey = $('[data-journey]');
if (journey) {
  const view = $('[data-mapview]', journey);
  const svg = $('[data-map]', journey);
  const road = $('#road', svg);
  const card = $('[data-jcard]', journey);
  const meDot = $('[data-me-dot]', journey);
  const needle = $('.needle', journey);
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
      pic: li.dataset.pic || '', mark: li.dataset.landmark || '',
    };
  });
  const N = stops.length;
  journey.classList.add('is-map');

  /* read the map's shapes once: what to draw, how, and where it sits */
  const STYLE = {
    'm-block': { fill: 'block' },
    'm-park': { fill: 'park' },
    'm-water': { fill: 'water' },
    'm-river': { stroke: 'water', width: 46 },
    'm-street': { stroke: 'road', width: 14, alpha: .85, cap: 'butt' },
    'm-road-case': { stroke: 'hwyC', width: 64 },
    'm-road-main': { stroke: 'hwy', width: 52 },
    'm-road-line': { stroke: 'land', width: 3, alpha: .9, dash: [22, 26] },
  };
  const shapes = [];
  $$('rect, path', svg).forEach(el => {
    const st = STYLE[el.getAttribute('class')];
    if (!st) return;
    const width = Number(el.getAttribute('stroke-width')) || st.width || 0;
    let path;
    let box;
    if (el.tagName === 'rect') {
      const x = +el.getAttribute('x'); const y = +el.getAttribute('y');
      const w = +el.getAttribute('width'); const h = +el.getAttribute('height');
      path = new Path2D();
      if (path.roundRect) path.roundRect(x, y, w, h, +el.getAttribute('rx') || 0); else path.rect(x, y, w, h);
      box = { x, y, w, h };
    } else {
      path = new Path2D(el.getAttribute('d'));
      const b = el.getBBox();
      box = { x: b.x, y: b.y, w: b.width, h: b.height };
    }
    const m = width / 2 + 2;
    shapes.push({ ...st, width, path, x0: box.x - m, y0: box.y - m, x1: box.x + box.w + m, y1: box.y + box.h + m });
  });
  const roadPath = new Path2D(road.getAttribute('d'));

  /* little landmarks beside each stop, on the side away from the pin's label */
  const marks = [];
  const place = (href, x, y, size) => {
    const img = new Image();
    const m = { img, dark: null, x: x - size / 2, y: y - size / 2, size };
    img.decoding = 'async';
    img.onload = () => { m.dark = null; redraw(); };
    img.src = href;
    marks.push(m);
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
  /* at night the landmarks are dimmed once into their own small canvas */
  const darkened = m => {
    if (!m.dark) {
      const c = document.createElement('canvas');
      c.width = m.img.naturalWidth;
      c.height = m.img.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(m.img, 0, 0);
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = 'rgba(14, 22, 38, .4)';
      x.fillRect(0, 0, c.width, c.height);
      m.dark = c;
    }
    return m.dark;
  };

  svg.remove();
  const canvas = document.createElement('canvas');
  canvas.className = 'map';
  view.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let colors = {};
  function readColors() {
    const cs = getComputedStyle(journey);
    const v = n => cs.getPropertyValue(n).trim();
    colors = { land: v('--m-land'), block: v('--m-block'), park: v('--m-park'), water: v('--m-water'), road: v('--m-road'), hwy: v('--m-hwy'), hwyC: v('--m-hwy-c'), route: v('--route') };
  }
  readColors();
  new MutationObserver(() => { readColors(); redraw(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  let dpr = 1;
  function draw(vx, vy, z, walked) {
    const vw = W / z;
    const vh = H / z;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = colors.land;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, -vx * dpr * z, -vy * dpr * z);
    ctx.lineJoin = 'round';
    for (const s of shapes) {
      if (s.x1 < vx || s.y1 < vy || s.x0 > vx + vw || s.y0 > vy + vh) continue;
      ctx.globalAlpha = s.alpha || 1;
      if (s.fill) {
        ctx.fillStyle = colors[s.fill];
        ctx.fill(s.path);
      } else {
        ctx.strokeStyle = colors[s.stroke];
        ctx.lineWidth = s.width;
        ctx.lineCap = s.cap || 'round';
        ctx.setLineDash(s.dash || []);
        ctx.stroke(s.path);
      }
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    if (walked > 0) {
      ctx.globalAlpha = .9;
      ctx.strokeStyle = colors.route;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.setLineDash([walked, L + 20]);
      ctx.stroke(roadPath);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    const night = root.dataset.theme === 'dark';
    for (const m of marks) {
      if (!m.img.complete || !m.img.naturalWidth) continue;
      if (m.x + m.size < vx || m.y + m.size < vy || m.x > vx + vw || m.y > vy + vh) continue;
      ctx.drawImage(night ? darkened(m) : m.img, m.x, m.y, m.size, m.size);
    }
  }

  const pinLayer = $('[data-pins-layer]', journey);
  const pins = stops.map(s => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mk';
    b.style.setProperty('--c', s.c);
    b.setAttribute('aria-label', `Stop ${s.i + 1}: ${s.place}`);
    b.innerHTML = `<span class="mk-head"><span>${s.icon}</span></span><span class="mk-name">${esc(s.place)}</span>`;
    b.addEventListener('click', () => go(s.i));
    pinLayer.append(b);
    return b;
  });

  /* tap through the stops: no scroll hijacking, the map only moves on a tap,
     a swipe or an arrow key, and draws nothing while you just scroll past */
  const prevBtn = $('[data-j-prev]', journey);
  const nextBtn = $('[data-j-next]', journey);
  const countEl = $('[data-j-count]', journey);
  const nextLabel = $('[data-j-next-label]', journey);
  let W = 0;
  let H = 0;
  let mobile = false;
  let overview = null;
  let zStop = 1;
  let fx = 0;
  let fy = 0;
  let cur = -1;
  let cam = null;
  let walked = 0;
  let dotOn = false;
  let anim = 0;
  let drawn = '';

  const ease = t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const mix = (a, b, e) => a + (b - a) * e;
  const stopCam = i => ({ x: stops[i].x, y: stops[i].y, z: zStop, fx, fy });

  function layout() {
    W = view.clientWidth;
    H = view.clientHeight;
    if (!W || !H) return;
    mobile = W < 760;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const xs = stops.map(s => s.x);
    const ys = stops.map(s => s.y);
    const bx0 = Math.min(...xs) - 150;
    const bx1 = Math.max(...xs) + 220;
    const by0 = Math.min(...ys) - 130;
    const by1 = Math.max(...ys) + 80;
    const top = mobile ? 96 : 110;
    const bottom = H - (mobile ? 160 : 170);
    const z0 = Math.min((W - 40) / (bx1 - bx0), (bottom - top) / (by1 - by0));
    overview = { x: (bx0 + bx1) / 2, y: (by0 + by1) / 2, z: z0, fx: W / 2, fy: (top + bottom) / 2 };
    zStop = mobile ? clamp(W / 560, .58, .8) : clamp(H / 1000, .7, 1.05);
    const cardRight = mobile ? 0 : card.offsetLeft + card.offsetWidth;
    fx = mobile ? W * .38 : cardRight + (W - cardRight) / 2;
    fy = mobile ? clamp(H * .27, 168, 214) : H * .5;
    if (!anim) cam = cur < 0 ? overview : stopCam(cur);
    drawn = '';
    paint();
  }

  function paint() {
    if (!cam || !W) return;
    const key = `${cam.x.toFixed(1)},${cam.y.toFixed(1)},${cam.z.toFixed(4)},${walked.toFixed(1)},${dotOn}`;
    if (key === drawn) return;
    drawn = key;
    const vx = cam.x - cam.fx / cam.z;
    const vy = cam.y - cam.fy / cam.z;
    draw(vx, vy, cam.z, walked);
    const sx = x => (x - vx) * cam.z;
    const sy = y => (y - vy) * cam.z;
    pins.forEach((pin, n) => {
      pin.style.transform = `translate3d(${sx(stops[n].x).toFixed(1)}px, ${sy(stops[n].y).toFixed(1)}px, 0)`;
    });
    meDot.classList.toggle('is-on', dotOn);
    if (dotOn) {
      const p = at(walked);
      meDot.style.transform = `translate3d(${sx(p.x).toFixed(1)}px, ${sy(p.y).toFixed(1)}px, 0)`;
      if (needle) {
        const a = at(walked - 6);
        const b = at(walked + 6);
        needle.style.transform = `rotate(${(Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI).toFixed(1)}deg)`;
      }
    }
  }
  function redraw() { drawn = ''; paint(); }

  let shown = -1;
  let swapTimer;
  function fillCard(i) {
    const s = stops[i];
    card.style.setProperty('--c', s.c);
    const pic = s.pic ? `<span class="jc-pic media"><img src="${s.pic}" alt="" loading="lazy"></span>` : '';
    card.innerHTML = `<div class="jc-in"><div class="jc-top"><span class="jc-tile">${s.icon}</span><p>${esc(s.place)}<span>${esc(s.meta)}</span></p></div><div class="jc-body"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>${pic}</div>`;
  }
  function showCard(i) {
    if (i === shown) return;
    const first = shown < 0;
    shown = i;
    clearTimeout(swapTimer);
    if (i < 0) { card.classList.remove('is-on'); return; }
    if (first) { fillCard(i); card.classList.add('is-on'); return; }
    card.classList.add('is-swap');
    swapTimer = setTimeout(() => { fillCard(shown); card.classList.remove('is-swap'); }, 180);
  }

  function syncControls() {
    prevBtn.disabled = cur < 0;
    countEl.textContent = cur < 0 ? `${N} stops` : `${cur + 1} / ${N}`;
    nextLabel.textContent = cur < 0 ? 'Start the road' : cur === N - 1 ? 'See my work' : 'Next stop';
    nextBtn.classList.toggle('is-end', cur === N - 1);
    pins.forEach((pin, n) => {
      pin.classList.toggle('is-on', n === cur);
      pin.classList.toggle('is-future', cur >= 0 && n > cur);
    });
  }

  function go(i) {
    i = clamp(i, -1, N - 1);
    if (i === cur || !cam) return;
    const from = { ...cam };
    const fromWalk = walked;
    const prev = cur;
    cur = i;
    syncControls();
    const toWalk = i < 0 ? 0 : stops[i].len;
    const hops = Math.abs(i - prev);
    let frame;
    let dur;
    if (prev >= 0 && i >= 0) {
      /* drive along the road, lifting the camera a little on the way */
      dur = Math.min(800 + hops * 220, 1700);
      const lift = .35 + Math.min(hops - 1, 3) * .15;
      frame = e => {
        walked = mix(fromWalk, toWalk, e);
        const p = at(walked);
        cam = { x: p.x, y: p.y, z: zStop / (1 + lift * 4 * e * (1 - e)), fx, fy };
        dotOn = true;
      };
    } else {
      /* fly in from the whole road, or back out to it */
      dur = 1100;
      const to = i < 0 ? overview : stopCam(i);
      frame = e => {
        cam = { x: mix(from.x, to.x, e), y: mix(from.y, to.y, e), z: Math.exp(mix(Math.log(from.z), Math.log(to.z), e)), fx: mix(from.fx, to.fx, e), fy: mix(from.fy, to.fy, e) };
        walked = mix(fromWalk, toWalk, e);
        dotOn = i >= 0 && e > .85;
      };
    }
    if (reduced) dur = 1;
    cancelAnimationFrame(anim);
    if (i < 0) showCard(-1);
    const t0 = performance.now();
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = ease(t);
      frame(e);
      paint();
      if (t > .55) showCard(i);
      anim = t < 1 ? requestAnimationFrame(step) : 0;
    };
    anim = requestAnimationFrame(step);
  }

  prevBtn.addEventListener('click', () => go(cur - 1));
  nextBtn.addEventListener('click', () => {
    if (cur === N - 1) { $('#work')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); return; }
    go(cur + 1);
  });

  /* swipe the map sideways to move between stops; up and down still scroll */
  let sx0 = 0;
  let sy0 = 0;
  let swiping = false;
  view.addEventListener('pointerdown', e => { sx0 = e.clientX; sy0 = e.clientY; swiping = true; });
  view.addEventListener('pointercancel', () => { swiping = false; });
  view.addEventListener('pointerup', e => {
    if (!swiping) return;
    swiping = false;
    const dx = e.clientX - sx0;
    const dy = e.clientY - sy0;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? cur + 1 : cur - 1);
  });

  /* arrow keys while the map fills most of the screen */
  let inView = false;
  new IntersectionObserver(([en]) => { inView = en.intersectionRatio > .6; }, { threshold: [0, .6, 1] }).observe(view);
  addEventListener('keydown', e => {
    if (!inView || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });

  syncControls();
  let lastW = 0;
  addEventListener('resize', () => { if (view.clientWidth !== lastW || !mobile) { lastW = view.clientWidth; layout(); } });
  document.fonts?.ready.then(layout);
  layout();
  lastW = view.clientWidth;
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
  const sumEl = $('[data-deck-summary]', deck);
  const idxEl = $('[data-deck-index]', deck);
  const openEl = $('[data-deck-open]', deck);
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
    const c = cards[front];
    sumEl.textContent = c.dataset.about;
    idxEl.textContent = String(front + 1);
    openEl.href = c.getAttribute('href');
    openEl.textContent = `See ${c.dataset.category.toLowerCase()}`;
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

/* ---------- visitors and the wall (served by the SkiFi server's API) ---------- */
const API = '/api';
const visits = $('[data-visits]');
if (visits) {
  let first = false;
  try { first = !localStorage.getItem('seen'); localStorage.setItem('seen', '1'); } catch {}
  fetch(`${API}/visit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first }) })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(d => {
      if (!Number.isFinite(d.visitors) || d.visitors < 1) return;
      $('[data-visits-count]', visits).textContent = d.visitors.toLocaleString('en-US');
      visits.hidden = false;
    })
    .catch(() => {});
}

const wall = $('[data-wall]');
if (wall) {
  const COLORS = ['#ffe98a', '#ffd1c4', '#cfe7ff', '#cdefd9', '#e6dcff', '#ffdcb0', '#c9f0ef', '#f8d1e6', '#dfeec1', '#ffe2c2', '#d6e4ff', '#fbe3a6'];
  const INKS = ['#b07d00', '#c4472b', '#2e6fb5', '#2b8a5b', '#6b52c8', '#c26a14', '#16867f', '#b0457c', '#5f7d18', '#c0661c', '#3f62c4', '#9a7400'];
  const list = $('[data-wall-notes]', wall);
  const form = $('[data-wall-form]', wall);
  const status = $('[data-wall-status]', wall);
  const avatarBtn = $('[data-avatar]', wall);
  const letterEl = $('[data-avatar-letter]', wall);
  const countEl = $('[data-wall-count]', wall);
  let avatar = Math.floor(Math.random() * COLORS.length);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const when = iso => {
    const days = Math.round((new Date(iso) - Date.now()) / 86400000);
    if (days > -7) return rtf.format(days, 'day');
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const paintAvatar = () => {
    avatarBtn.style.setProperty('--a', COLORS[avatar]);
    avatarBtn.style.setProperty('--ai-ink', INKS[avatar]);
    const n = $('#wall-name', form).value.trim();
    letterEl.textContent = n ? n[0].toUpperCase() : '?';
  };
  const noteEl = (n, fresh = false) => {
    const li = document.createElement('li');
    li.className = `note wall-note${fresh ? ' is-fresh' : ''}`;
    li.style.setProperty('--n', COLORS[n.avatar % COLORS.length]);
    li.style.setProperty('--rot', `${((n.id.charCodeAt(0) + n.id.charCodeAt(1)) % 7) - 3}deg`);
    const msg = document.createElement('p');
    msg.className = 'wn-msg';
    msg.textContent = n.message;
    const who = document.createElement('div');
    who.className = 'wn-who';
    const av = document.createElement('span');
    av.className = 'avatar avatar-sm';
    av.style.setProperty('--a', '#fff');
    av.style.setProperty('--ai-ink', INKS[n.avatar % INKS.length]);
    av.textContent = n.name[0].toUpperCase();
    const meta = document.createElement('p');
    const b = document.createElement('b');
    b.textContent = n.name;
    const small = document.createElement('span');
    small.textContent = [n.work, when(n.at)].filter(Boolean).join(', ');
    meta.append(b, small);
    who.append(av, meta);
    li.append(msg, who);
    return li;
  };
  fetch(`${API}/notes`)
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(d => {
      wall.hidden = false;
      list.replaceChildren(...d.notes.map(n => noteEl(n)));
      if (!d.notes.length) list.append(Object.assign(document.createElement('li'), { className: 'wall-empty', textContent: 'No notes yet. Be the first to pin one.' }));
      queue();
    })
    .catch(() => {});

  paintAvatar();
  avatarBtn.addEventListener('click', () => {
    avatar = (avatar + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
    paintAvatar();
    if (!reduced) { avatarBtn.classList.remove('is-spin'); void avatarBtn.offsetWidth; avatarBtn.classList.add('is-spin'); }
  });
  $('#wall-name', form).addEventListener('input', paintAvatar);
  const msg = $('#wall-msg', form);
  msg.addEventListener('input', () => { countEl.textContent = `${msg.value.length}/200`; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    status.className = 'form-status';
    if (!data.name.trim() || !data.message.trim()) {
      status.classList.add('is-error');
      status.textContent = 'Add your name and a note.';
      return;
    }
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    try {
      const res = await fetch(`${API}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, avatar }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || 'The note did not pin. Try again.');
      if (out.note) {
        $('.wall-empty', list)?.remove();
        list.prepend(noteEl(out.note, true));
      }
      form.reset();
      countEl.textContent = '0/200';
      paintAvatar();
      status.classList.add('is-success');
      status.textContent = 'Pinned. Thanks for stopping by.';
    } catch (err) {
      status.classList.add('is-error');
      status.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });

  /* the boarding pass can be moved around */
  const pass = $('[data-pass]', wall);
  if (pass && matchMedia('(min-width: 901px) and (pointer: fine)').matches) {
    pass.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const sx = e.clientX;
      const sy = e.clientY;
      const ox = Number(pass.dataset.x || 0);
      const oy = Number(pass.dataset.y || 0);
      pass.setPointerCapture(e.pointerId);
      pass.classList.add('is-drag');
      const move = ev => {
        pass.dataset.x = String(ox + ev.clientX - sx);
        pass.dataset.y = String(oy + ev.clientY - sy);
        pass.style.setProperty('--dx', `${pass.dataset.x}px`);
        pass.style.setProperty('--dy', `${pass.dataset.y}px`);
      };
      const up = () => { pass.classList.remove('is-drag'); pass.removeEventListener('pointermove', move); };
      pass.addEventListener('pointermove', move);
      pass.addEventListener('pointerup', up, { once: true });
      pass.addEventListener('pointercancel', up, { once: true });
    });
  }
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
  /* the hero words arrive once the page is ready */
  const stageEl = $('[data-stage]');
  if (stageEl) {
    const h1 = $('#hero-title', stageEl);
    if (h1) splitWords(h1, 'w', '--wi');
    stageEl.classList.add('is-pre');
    Promise.race([document.fonts?.ready, new Promise(r => setTimeout(r, 900))])
      .then(() => requestAnimationFrame(() => requestAnimationFrame(() => stageEl.classList.remove('is-pre'))));
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
  group('.tools', '.tool', 'anim-pop');
  group('.hats', 'li', 'anim-rise');
  group('.keys', '.kw', 'anim-pop');
  group('.work-grid', '.work-card:nth-child(-n+6)', 'anim-rise');
  $$('.sec-head, .proof h2, .hello h2, .hello-sub, .studio-grid h2, .deck-side, .brief, .app-head, .app-story').forEach(el => {
    el.classList.add('anim-rise');
    io.observe(el);
  });
  $$('.hl').forEach(el => { el.classList.add('anim-hl'); io.observe(el); });

  /* numbers count up the first time they show */
  const countEls = $$('.note strong');
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
