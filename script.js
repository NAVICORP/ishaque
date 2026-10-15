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

/* computers with a mouse get eased scrolling, which makes the fly-through and
   the word reveal feel like one motion; phones keep their native scroll */
if (!reduced && innerWidth >= 860 && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const tag = document.createElement('script');
  tag.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
  tag.onload = () => {
    if (!window.Lenis) return;
    const lenis = new window.Lenis({ lerp: .09, smoothWheel: true, wheelMultiplier: .9 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    /* in-page links go through Lenis so they ease too */
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      const el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -8, duration: 1.1, easing: t => 1 - (1 - t) ** 4 });
    });
  };
  document.head.append(tag);
}
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

/* ---------- top bar: the visitor pill gets shorter once you scroll ---------- */
let scrolledState = null;
onFrame.push(() => {
  const on = scrollY > innerHeight * .5;
  if (on !== scrolledState) { scrolledState = on; root.classList.toggle('is-scrolled', on); }
});

/* ---------- dock: the pill slides to the section you're in ---------- */
const dock = $('[data-dock]');
const dockInd = $('[data-dock-ind]');
function moveDockTo(link) {
  if (!dock || !dockInd) return;
  if (!link || link.offsetParent === null) { dockInd.style.opacity = '0'; return; }
  $$('a', dock).forEach(a => a.classList.toggle('is-on', a === link));
  dockInd.style.opacity = '1';
  dockInd.style.width = `${link.offsetWidth}px`;
  dockInd.style.transform = `translateX(${link.offsetLeft}px)`;
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
  /* the pill follows the link as its icon slides open */
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(place); $$('a', dock).forEach(a => ro.observe(a)); }
  place();
}

/* ---------- the valley: a camera over the painted scene ----------
 * The scene is a 1600 by 1000 picture in layers, each with a depth. On a
 * computer, scrolling flies you through it: each layer grows by its depth and
 * the foreground slips past; the pointer tilts it a little. On a phone the
 * picture is wider than the screen and can be dragged. Tapping a pin zooms
 * the camera to that place and opens its sheet. */
const stage = $('[data-stage]');
const cam = $('[data-cam]');
if (stage && cam) {
  const valley = stage.parentElement;
  const layers = $$('.ly', cam).map(el => ({ el, d: Number(el.dataset.d) || 0 }));
  const heroCopy = $('[data-hero-copy]', stage);
  const shade = $('[data-shade]', stage);
  const cue = $('[data-cue]', stage);
  const hsheet = $('[data-hsheet-panel]', stage);
  const body = $('[data-hsheet-body]', hsheet);
  const pins = $$('[data-hsheet]', cam);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const range = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let vw = 0; let vh = 0; let mobile = false; let SW = 0; let SH = 0; let u = 1;
  let baseX = 0; let baseY = 0; let ax = .5; let vTop = 0; let vRange = 1; let pV = 0;
  const cur = { x: 0, y: 0, s: reduced ? 1 : 1.18, ok: false };
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  let focusId = null; let rate = 2; const t0 = performance.now();
  let lastT = t0;

  function layout() {
    vw = innerWidth; vh = stage.clientHeight; mobile = vw < 760;
    if (!cur.ok) ax = mobile ? .44 : .5;
    /* the picture always covers the stage; phones get a wider one to drag */
    u = Math.max(vw / 1600, vh / 1000) * (mobile ? 1.1 : 1.06);
    SW = 1600 * u; SH = 1000 * u;
    cam.style.width = `${SW}px`; cam.style.height = `${SH}px`; cam.style.setProperty('--u', `${u}px`);
    baseX = (vw - SW) * ax; baseY = vh - SH;
    vTop = valley.getBoundingClientRect().top + scrollY; vRange = Math.max(1, valley.offsetHeight - vh);
    if (!cur.ok) { cur.x = baseX - (cur.s - 1) * SW * .5; cur.y = baseY - (cur.s - 1) * SH * .6; cur.ok = true; }
  }
  const clampCam = o => { o.x = Math.min(0, Math.max(vw - o.s * SW, o.x)); o.y = Math.min(0, Math.max(vh - o.s * SH, o.y)); return o; };
  function focusCam(pin) {
    const fx = Number(pin.style.getPropertyValue('--px')) / 1600;
    const fy = (Number(pin.style.getPropertyValue('--py')) - 40) / 1000;
    const s = mobile ? 1.7 : 1.45;
    const left = fx < .5;
    const sx = mobile ? vw * .5 : (left ? vw * .68 : vw * .34);
    const sy = mobile ? vh * .22 : vh * .5;
    return clampCam({ x: sx - s * fx * SW, y: sy - s * fy * SH, s });
  }

  /* the sheet about a place */
  let openPin = null; let hideTimer;
  const close = () => {
    if (!openPin) return;
    hsheet.classList.remove('is-open');
    openPin.classList.remove('is-on'); openPin.setAttribute('aria-expanded', 'false');
    openPin = null; focusId = null; rate = 2.6;
    stage.classList.remove('is-focus');
    clearTimeout(hideTimer); hideTimer = setTimeout(() => { hsheet.hidden = true; }, 260);
  };
  const open = pin => {
    if (openPin === pin) { close(); return; }
    if (pV > .04) { scrollTo({ top: vTop, behavior: reduced ? 'auto' : 'smooth' }); setTimeout(() => open(pin), 700); return; }
    clearTimeout(hideTimer);
    openPin?.classList.remove('is-on');
    openPin = pin; focusId = pin; rate = 3;
    pin.classList.add('is-on'); pin.setAttribute('aria-expanded', 'true');
    stage.classList.add('is-focus');
    hsheet.classList.toggle('is-left', Number(pin.style.getPropertyValue('--px')) >= 800);
    body.replaceChildren($(`#hs-${pin.dataset.hsheet}`).content.cloneNode(true));
    hsheet.hidden = false; hsheet.scrollTop = 0;
    hsheet.classList.remove('is-open'); void hsheet.offsetWidth; hsheet.classList.add('is-open');
  };
  pins.forEach(pin => {
    pin.setAttribute('aria-expanded', 'false');
    pin.addEventListener('click', e => { e.stopPropagation(); open(pin); });
  });
  hsheet.addEventListener('click', e => { if (e.target.closest('[data-hsheet-close]')) close(); e.stopPropagation(); });
  document.addEventListener('click', e => { if (!e.target.closest('.hpin')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  /* the pointer tilts the scene; a drag pans it on phones */
  if (fine) {
    stage.addEventListener('pointermove', e => { ptr.x = (e.clientX / vw - .5) * 2; ptr.y = (e.clientY / vh - .5) * 2; });
    stage.addEventListener('pointerleave', () => { ptr.x = 0; ptr.y = 0; });
  }
  let drag = null;
  stage.addEventListener('pointerdown', e => { if (!mobile || e.target.closest('.hpin, .hsheet')) return; drag = { x: e.clientX, ax }; });
  stage.addEventListener('pointermove', e => { if (!drag) return; ax = clamp(drag.ax - (e.clientX - drag.x) / (SW - vw), 0, 1); baseX = (vw - SW) * ax; });
  const endDrag = () => { drag = null; };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);

  /* the scroll cue shows after a quiet moment at the top */
  let cueT;
  const armCue = (wait = 1500) => { clearTimeout(cueT); cueT = setTimeout(() => { if (pV < .002 && !focusId && !document.hidden) cue.classList.add('is-idle'); }, wait); };
  ['scroll', 'wheel', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => armCue(), { passive: true }));
  if (!mobile) armCue(3500);

  function frame() {
    const now = performance.now(); const dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    const top = stage.getBoundingClientRect().top;
    if (top < -vh * 1.5 && !focusId) return;
    pV = mobile || reduced ? 0 : clamp((scrollY - vTop) / vRange, 0, 1);
    if (focusId && pV > .04) close();
    const e = smooth(pV);
    rate += ((focusId ? 3 : 2.2) - rate) * clamp(dt, 0, 1);
    const T = focusId ? focusCam(focusId) : { x: baseX, y: baseY, s: 1 };
    const k = reduced ? 1 : 1 - Math.exp(-dt * rate);
    cur.x = lerp(cur.x, T.x, k); cur.y = lerp(cur.y, T.y, k); cur.s = lerp(cur.s, T.s, k);
    ptr.sx = lerp(ptr.sx, ptr.x, clamp(dt * 2.6, 0, 1)); ptr.sy = lerp(ptr.sy, ptr.y, clamp(dt * 2.6, 0, 1));
    cam.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0) scale(${cur.s.toFixed(4)})`;
    stage.classList.toggle('is-flying', pV > .03);
    for (const L of layers) {
      const sc = 1 + e * (.04 + L.d * .16);
      const tx = -ptr.sx * L.d * 26;
      const ty = -ptr.sy * L.d * 12 + e * L.d * 30 * u;
      L.el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
    }
    const t = range(pV, .02, .3);
    heroCopy.style.transform = `translate3d(0, ${(-t * vh * .35).toFixed(1)}px, 0)`;
    heroCopy.style.opacity = focusId ? '0' : (1 - t * 1.2).toFixed(3);
    shade.style.opacity = range(pV, .25, .65).toFixed(3);
    if (pV > .002 || focusId) cue.classList.remove('is-idle');
  }
  const loop = () => { frame(); requestAnimationFrame(loop); };
  addEventListener('resize', () => { layout(); });
  layout();
  requestAnimationFrame(loop);
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
      link: li.dataset.link || '', linkLabel: li.dataset.linkLabel || 'See more',
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
    'm-street': { stroke: 'road', width: 10, alpha: .9, cap: 'butt' },
    'm-hwy': { stroke: 'hwy', width: 22, alpha: .9 },
    'm-road-main': { stroke: 'route', width: 5, alpha: .6, dash: [1, 12], fixed: 2.6 },
  };
  const shapes = [];
  const labels = $$('text', svg).map(el => ({ text: el.textContent, x: +el.getAttribute('x'), y: +el.getAttribute('y'), size: +el.getAttribute('font-size') || 36 }));
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
  /* the map's colours come from the CSS variables, with the palette as a
     fallback: a canvas quietly keeps its last colour (black at first) when
     it is handed something it cannot read, which painted the whole map black
     on iPhones where the variables came back empty */
  const PALETTE = {
    light: { land: '#faf8f3', block: '#e6e0d6', park: '#d4ead0', water: '#b6d8f5', road: '#ffffff', hwy: '#f6dc8a', hwyC: '#edc458', route: '#2e7dda', label: '#8e95a8' },
    dark: { land: '#161e2c', block: '#212b3d', park: '#1c3329', water: '#19314f', road: '#232d40', hwy: '#5c4a1f', hwyC: '#3f3418', route: '#78b2ff', label: '#6d7891' },
  };
  const probe = document.createElement('canvas').getContext('2d');
  const valid = c => { if (!c) return false; probe.fillStyle = '#010203'; probe.fillStyle = c; return probe.fillStyle !== '#010203' || c === '#010203'; };
  let colors = {};
  let colorsStale = true;
  function readColors() {
    const base = PALETTE[root.dataset.theme === 'dark' ? 'dark' : 'light'];
    let cs;
    try { cs = getComputedStyle(journey); } catch { cs = null; }
    const v = (n, k) => { const c = cs ? cs.getPropertyValue(n).trim() : ''; return valid(c) ? c : base[k]; };
    colors = { land: v('--m-land', 'land'), block: v('--m-block', 'block'), park: v('--m-park', 'park'), water: v('--m-water', 'water'), road: v('--m-road', 'road'), hwy: v('--m-hwy', 'hwy'), hwyC: v('--m-hwy-c', 'hwyC'), route: v('--route', 'route'), label: v('--m-label', 'label') };
    colorsStale = false;
  }
  new MutationObserver(() => { colorsStale = true; redraw(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  let dpr = 1;
  function draw(vx, vy, z, walked) {
    const vw = W / z;
    const vh = H / z;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (colorsStale) readColors();
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
        /* the trail keeps the same thickness on screen however far out the map is */
        ctx.lineWidth = s.fixed ? s.fixed / z : s.width;
        ctx.lineCap = s.cap || 'round';
        ctx.setLineDash(s.fixed ? [1 / z, 10 / z] : (s.dash || []));
        ctx.stroke(s.path);
      }
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = colors.label;
    ctx.textAlign = 'center';
    ctx.font = '700 36px ' + getComputedStyle(root).getPropertyValue('--sans');
    for (const t of labels) {
      if (t.x + 300 < vx || t.y < vy || t.x - 300 > vx + vw || t.y - 40 > vy + vh) continue;
      ctx.fillText(t.text, t.x, t.y);
    }
    if (walked > 0) {
      ctx.globalAlpha = .95;
      ctx.strokeStyle = colors.route;
      ctx.lineWidth = 9;
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
    card.innerHTML = `<div class="jc-in"><div class="jc-top"><span class="jc-tile">${s.icon}</span><p>${esc(s.place)}<span class="jc-meta"><svg class="i" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>${esc(s.meta)}</span></p></div><div class="jc-body"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.link ? `<a class="jc-link" href="${esc(s.link)}"${/^https?:/.test(s.link) ? ' target="_blank" rel="noopener"' : ''}>${esc(s.linkLabel)}<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>` : ''}</div>${pic}</div>`;
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
  if (external) {
    a.target = '_blank';
    a.rel = 'noopener';
    a.insertAdjacentHTML('beforeend', '<svg class="i" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 7h10v10M7 17 17 7"/></svg>');
  }
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

/* ---------- selected work: a box of cards ----------
 * A real box: floor, walls and a lid in a 660 by 260 by 96 world, tilted
 * towards you. The cards start sunk below the floor, the lid swings open
 * when the box comes into view and the cards rise one by one. Hovering lifts
 * a card; picking one turns it to face you, then opens that kind of work. */
const cbox = $('[data-cbox]');
if (cbox) {
  const scene = $('[data-cbox-scene]', cbox);
  const box3 = $('[data-box3]', cbox);
  const fit = $('.box-fit', cbox);
  const cap = $('[data-box-cap]', cbox);
  const items = $$('.citem', cbox);
  const list = $('[data-clist]', cbox);
  const BW = 660; const BD = 260; const BH = 96; const CW = 224; const CH = 304;
  const SUNK = -(CH - BH + 40);
  const face = (cls, w, h, x, y, z, rot, html = '') => {
    const el = document.createElement('div');
    el.className = `f ${cls}`;
    el.style.width = `${w}px`; el.style.height = `${h}px`;
    el.style.left = `${x - w / 2}px`; el.style.top = `${y - h}px`;
    el.style.transform = `translate3d(0,0,${z}px) ${rot}`;
    el.innerHTML = html;
    return el;
  };
  const cards = $$('.wk', box3);
  const n = cards.length;
  const shadow = document.createElement('div'); shadow.className = 'box-shadow';
  const floor = document.createElement('div'); floor.className = 'box-floor';
  box3.prepend(shadow, floor,
    face('wall-i', BW, BH, BW / 2, 0, 0, 'rotateX(-90deg)'),
    face('wall-i', BD, BH, 0, BD / 2, 0, 'rotateZ(90deg) rotateX(-90deg)'));
  const lid = face('box-lid', BW, BD, BW / 2, 0, BH, 'rotateX(-180deg)');
  box3.insertBefore(lid, cards[0]);
  box3.append(
    face('wall-o', BD, BH, BW, BD / 2, 0, 'rotateZ(-90deg) rotateX(-90deg)'),
    face('wall-o', BW, BH, BW / 2, BD, 0, 'rotateX(-90deg)', '<span class="brand">Things I designed</span>'));
  const stand = z => `translate3d(0, 0, ${z}px) rotateZ(-90deg) rotateX(-90deg)`;
  const faced = k => `translate3d(${(BW / 2 - k.x).toFixed(1)}px, ${BD * .95}px, 210px) rotateZ(-30deg) rotateX(-57deg)`;
  /* a card below the floor is clipped there, so nothing pokes out underneath */
  const rim = (k, z) => { k.el.style.clipPath = z < 0 ? `inset(${z <= SUNK ? 0 : -90}px -90px ${-z}px -90px)` : (k.el.style.clipPath ? 'inset(-90px -90px 0 -90px)' : ''); };
  const wks = cards.map((el, i) => {
    const x = 108 + i * ((BW - 216) / (n - 1));
    el.style.left = `${x - CW / 2}px`; el.style.top = `${BD / 2 - CH}px`;
    const k = { el, i, x, z: SUNK };
    el.style.transform = stand(SUNK); rim(k, SUNK);
    return k;
  });
  let open = false; let picked = null; let hoverK = null; let active = -1;

  const fitBox = () => {
    const w = scene.clientWidth;
    const bs = clamp(Math.min(w / 800, scene.clientHeight / 560), .4, 1);
    fit.style.setProperty('--bs', bs.toFixed(3));
    /* the open lid leans back and to the right, so the box sits a touch left of centre */
    fit.style.left = `calc(50% - ${(28 * bs).toFixed(1)}px)`;
  };
  const mark = k => {
    active = k ? k.i : -1;
    items.forEach((it, j) => it.classList.toggle('is-on', j === active));
    if (k && list.scrollWidth > list.clientWidth) list.scrollTo({ left: items[active].parentElement.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft), behavior: reduced ? 'auto' : 'smooth' });
  };
  const enter = k => { if (picked || !open) return; hoverK = k; k.el.classList.add('hover'); k.el.style.transform = stand(70); rim(k, 70); mark(k); };
  const leave = k => { if (picked) return; k.el.classList.remove('hover'); k.el.style.transform = stand(k.z); rim(k, k.z); if (hoverK === k) { hoverK = null; } };
  /* on a phone the first tap turns the card to face you and it stays; the second tap opens it */
  const touch = () => !matchMedia('(hover: hover)').matches;
  let facedK = null;
  const unface = () => { if (!facedK) return; const k = facedK; facedK = null; k.el.classList.remove('is-pick'); k.el.style.transform = stand(0); rim(k, 0); };
  const faceUp = (k) => {
    if (facedK === k) return;
    unface(); hoverK && leave(hoverK);
    facedK = k; mark(k);
    k.el.classList.add('is-pick'); k.el.style.clipPath = ''; k.el.style.transform = faced(k);
  };
  const go = k => { location.href = k.el.getAttribute('href'); };
  const pick = (k, e) => {
    if (!open) return;
    if (e && !plainClick(e)) return;
    e?.preventDefault();
    if (picked) return;
    if (touch()) {
      if (facedK === k) { picked = k; go(k); return; }
      faceUp(k); return;
    }
    picked = k; mark(k);
    k.el.classList.add('is-pick'); k.el.style.clipPath = ''; k.el.style.transform = faced(k);
    setTimeout(() => go(k), reduced ? 0 : 700);
    setTimeout(() => { picked = null; k.el.classList.remove('is-pick'); k.el.style.transform = stand(0); }, 2200);
  };
  const openBox = () => {
    if (open) return; open = true; scene.classList.add('is-open');
    lid.style.transform = `translate3d(0,0,${BH}px) rotateX(-72deg)`;
    setTimeout(() => scene.classList.add('is-cards'), reduced ? 0 : 520);
    wks.forEach((k, i) => setTimeout(() => {
      k.z = 0; k.el.style.transform = stand(0); rim(k, 0);
      setTimeout(() => { if (k.z === 0 && !k.el.classList.contains('hover')) k.el.style.clipPath = ''; }, 1300);
      if (i === n - 1) setTimeout(() => { cards.forEach(c => { c.tabIndex = 0; }); }, 1300);
    }, (reduced ? 0 : 800) + i * (reduced ? 0 : 130)));
  };
  wks.forEach(k => {
    k.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && hoverK !== k) { hoverK && leave(hoverK); enter(k); } });
    k.el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') leave(k); });
    k.el.addEventListener('focus', () => { hoverK && leave(hoverK); enter(k); });
    k.el.addEventListener('blur', () => leave(k));
    k.el.addEventListener('click', e => pick(k, e));
  });
  items.forEach((it, i) => {
    it.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && open && hoverK !== wks[i]) { hoverK && leave(hoverK); enter(wks[i]); } });
    it.addEventListener('click', e => {
      if (!open) return;
      pick(wks[i], e);
    });
  });
  /* swiping the box moves the lifted card along */
  let sx = null;
  scene.addEventListener('pointerdown', e => { sx = e.clientX; });
  scene.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 40 && open) { scene.dataset.swiped = '1'; const cur = touch() ? (facedK ? facedK.i : -1) : (hoverK ? hoverK.i : -1); const j = clamp(cur + (dx < 0 ? 1 : -1), 0, n - 1); if (touch()) faceUp(wks[j]); else { hoverK && leave(hoverK); enter(wks[j]); } }
  });
  scene.addEventListener('click', e => { if (scene.dataset.swiped) { e.preventDefault(); e.stopPropagation(); delete scene.dataset.swiped; } }, true);
  cbox.addEventListener('keydown', e => {
    if (!open || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const j = clamp((hoverK ? hoverK.i : -1) + (e.key === 'ArrowRight' ? 1 : -1), 0, n - 1);
    wks[j].el.focus({ preventScroll: true });
  });
  fitBox();
  addEventListener('resize', fitBox);
  if (reduced || !('IntersectionObserver' in window)) openBox();
  else {
    const o = new IntersectionObserver(([en]) => { if (en.isIntersecting) { o.disconnect(); openBox(); } }, { threshold: .45 });
    o.observe(scene);
  }
}

/* ---------- stack: the gift box ---------- */
const gift = $('[data-gift]');
if (gift) {
  const tools = $$('.tool', gift);
  const grid = $('.tools', gift);
  const stage = $('.gift-stage', gift);
  const lid = $('[data-lid]', gift);
  const burst = $('.gift-burst', gift);
  const beam = $('.gift-beam', gift);
  const strings = $('[data-strings]', gift);
  const confetti = $('[data-confetti]', gift);
  const btn = $('[data-unwrap]', gift);
  const range = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const COLORS = ['#ffd23f', '#ff6b4a', '#2f7fd8', '#4f9e4a', '#b7a2ff'];
  const bits = Array.from({ length: 16 }, (_, k) => {
    const el = document.createElement('i');
    el.style.setProperty('--c', COLORS[k % 5]);
    confetti.append(el);
    return { el, x0: ((k * 37) % 120) - 60, x1: ((k * 71) % 300) - 150, h: 180 + (k * 29 % 10) * 22, r: (k * 53) % 360, t: (k % 6) * .04 };
  });
  const paths = tools.map(() => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); strings.append(p); return p; });
  let from = [];
  let mouth = { x: 0, y: 0 };
  /* the box slides down as the shelf unfolds, so its mouth is measured every frame while it moves */
  const aimMouth = () => {
    const g = gift.getBoundingClientRect();
    const b = stage.getBoundingClientRect();
    mouth = { x: b.left + b.width / 2 - g.left, y: b.top + b.height * .4 - g.top };
    strings.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  };
  const aim = () => {
    gift.style.setProperty('--th', `${grid.offsetHeight + parseFloat(getComputedStyle(grid).marginTop)}px`);
    const g = gift.getBoundingClientRect();
    from = tools.map(t => { const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2 - g.left, y: r.top + r.height / 2 - g.top }; });
    aimMouth();
  };
  let q = 0; let t0 = 0; let going = false; let done = false; let auto;
  const paint = () => {
    const u = going ? Math.min(1, (performance.now() - t0) / 7000) : 0;
    q = reduced ? (going ? 1 : 0) : (u < 1 ? .5 - .5 * Math.cos(Math.PI * u) : 1);
    const l = range(q, 0, .4);
    if (going && u < .2) aimMouth();
    /* the lid moves in the picture's own units, so the throw scales with the box */
    lid.style.transform = `translate(${(l * 110).toFixed(1)}px, ${(-Math.sin(l * Math.PI) * 230 + l * 118).toFixed(1)}px) rotate(${(l * 30).toFixed(1)}deg)`;
    burst.style.opacity = (range(q, .08, .3) * (1 - range(q, .55, 1) * .55)).toFixed(3);
    beam.style.opacity = (range(q, .14, .45) * (1 - range(q, .8, 1) * .75)).toFixed(3);
    bits.forEach(c => {
      const p = range(q, .1 + c.t, .55 + c.t);
      const x = c.x0 + (c.x1 - c.x0) * p;
      const y = -Math.sin(p * Math.PI) * c.h + p * p * 120;
      c.el.style.opacity = p > 0 && p < 1 ? (1 - p * .6).toFixed(2) : '0';
      c.el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) rotate(${(c.r + p * 540).toFixed(0)}deg)`;
    });
    const st = .4 / tools.length;
    tools.forEach((t, i) => {
      const p = range(q, .2 + i * st, .58 + i * st);
      const e = 1 - (1 - p) ** 3;
      const f = from[i] || mouth;
      const dx = mouth.x - f.x; const dy = mouth.y - f.y;
      const lift = -Math.sin(p * Math.PI) * 36;
      t.style.opacity = p > 0 ? '1' : '0';
      t.style.transform = p >= 1 ? '' : `translate(${(dx * (1 - e)).toFixed(1)}px, ${(dy * (1 - e) + lift).toFixed(1)}px) scale(${(.3 + .7 * e).toFixed(3)}) rotate(${((1 - e) * -25).toFixed(1)}deg)`;
      const sx = f.x + dx * (1 - e); const sy = f.y + dy * (1 - e) + lift;
      paths[i].setAttribute('d', `M${mouth.x.toFixed(1)} ${mouth.y.toFixed(1)} Q${((mouth.x + sx) / 2).toFixed(1)} ${(Math.max(mouth.y, sy) + 30).toFixed(1)} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      paths[i].style.opacity = (p * (1 - range(q, .9, 1))).toFixed(2);
    });
    if (going && u < 1) requestAnimationFrame(paint);
    else if (going) { done = true; gift.classList.add('is-done'); strings.hidden = true; }
  };
  const unwrap = () => {
    if (going) return;
    clearTimeout(auto);
    aim();
    going = true; t0 = performance.now();
    gift.classList.add('is-open');
    btn.classList.add('is-gone');
    requestAnimationFrame(paint);
  };
  gift.classList.add('is-wrapped');
  aim(); paint();
  addEventListener('resize', () => { if (!done) { aim(); paint(); } });
  btn.addEventListener('click', unwrap);
  stage.addEventListener('click', unwrap);
  const o = new IntersectionObserver(([en]) => { clearTimeout(auto); if (en.isIntersecting && !going) auto = setTimeout(unwrap, 4000); }, { threshold: .7 });
  o.observe(stage);
}

/* ---------- off the clock: a corkboard you can rearrange ---------- */
$$('[data-item]').forEach(item => {
  item.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('a, button') && item.tagName !== 'A') return;
    const sx = e.clientX; const sy = e.clientY;
    const ox = Number(item.dataset.x || 0); const oy = Number(item.dataset.y || 0);
    let moved = false;
    item.setPointerCapture(e.pointerId);
    item.classList.add('is-drag');
    const move = ev => {
      const dx = ev.clientX - sx; const dy = ev.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      item.dataset.x = String(ox + dx); item.dataset.y = String(oy + dy);
      item.style.setProperty('--dx', `${item.dataset.x}px`); item.style.setProperty('--dy', `${item.dataset.y}px`);
    };
    const up = () => { item.classList.remove('is-drag'); item.removeEventListener('pointermove', move); if (moved) item.dataset.moved = '1'; };
    item.addEventListener('pointermove', move);
    item.addEventListener('pointerup', up, { once: true });
    item.addEventListener('pointercancel', up, { once: true });
  });
  /* a dragged link should not also open */
  item.addEventListener('click', e => { if (item.dataset.moved) { e.preventDefault(); delete item.dataset.moved; } });
});
/* share the site from a phone; on a desktop the button copies the link */
const shareBtn = $('[data-share]');
if (shareBtn) {
  const data = { title: 'Ishaque Nv.', text: 'I design products, and the pitch decks that sell them.', url: 'https://ishaquenv.com/' };
  if (navigator.share || navigator.clipboard) shareBtn.hidden = false;
  shareBtn.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); shareBtn.lastChild.textContent = 'Link copied'; setTimeout(() => { shareBtn.lastChild.textContent = 'Share this site'; }, 1600); }
    } catch {}
  });
}
const vinyl = $('[data-playlist]');
if (vinyl && vinyl.dataset.playlist) { vinyl.href = vinyl.dataset.playlist; vinyl.hidden = false; }
const kt = $('[data-kannur-time]');
if (kt) {
  const fmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => { kt.textContent = fmt.format(new Date()).replace(/\s?(am|pm)/i, (m, a) => ' ' + a.toLowerCase()); };
  tick(); setInterval(tick, 30000);
}
/* the process steps light up as they scroll into view */
const procSteps = $$('[data-proc] .proc-step');
if (procSteps.length && 'IntersectionObserver' in window && !reduced) {
  const po = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-on'); po.unobserve(en.target); } }), { rootMargin: '0px 0px -30% 0px', threshold: .4 });
  procSteps.forEach(st => po.observe(st));
} else procSteps.forEach(st => st.classList.add('is-on'));

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

/* copy the email with one tap */
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); } catch { return; }
  b.classList.add('is-done'); b.setAttribute('aria-label', 'Copied');
  setTimeout(() => { b.classList.remove('is-done'); b.setAttribute('aria-label', 'Copy email address'); }, 1600);
}));

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
  fetch(`${API}/visit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first, ref: document.referrer || '' }) })
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
    av.style.setProperty('--a', 'rgba(255, 255, 255, .85)');
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

  /* the form stays folded away until someone wants to write */
  const openBtn = $('[data-wall-open]', wall);
  openBtn?.addEventListener('click', () => {
    const show = form.hidden;
    form.hidden = !show;
    openBtn.setAttribute('aria-expanded', String(show));
    if (show) $('#wall-name', form).focus({ preventScroll: true });
  });

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

  /* big paragraphs: words fill in with the scroll, marks draw as they arrive */
  const reveals = $$('[data-reveal-words]').map(el => {
    let n = 0;
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const span = document.createElement('span');
            span.className = 'rw';
            span.textContent = part;
            span.dataset.n = String(n++);
            frag.append(span);
          });
          ch.replaceWith(frag);
        } else if (ch.tagName === 'IMG') {
          ch.classList.add('rw');
          ch.dataset.n = String(n++);
        } else if (ch.nodeType === 1) {
          walk(ch);
        }
      });
    };
    walk(el);
    el.classList.add('is-live');
    const words = $$('.rw', el);
    const marks = $$('.hl', el).map(h => ({ h, first: Number($('.rw', h)?.dataset.n ?? 0) }));
    marks.forEach(m => m.h.classList.remove('anim-hl'));
    return { el, words, marks, shown: -1 };
  });
  if (reveals.length) {
    onFrame.push(() => {
      const vh = innerHeight;
      reveals.forEach(r => {
        const box = r.el.getBoundingClientRect();
        if (box.top > vh || box.bottom < 0) return;
        const p = clamp((vh * .82 - box.top) / (box.height + vh * .3), 0, 1);
        const k = Math.round(p * r.words.length);
        if (k === r.shown) return;
        r.shown = k;
        r.words.forEach((w, i) => w.classList.toggle('on', i < k));
        r.marks.forEach(m => m.h.classList.toggle('on', m.first < k));
      });
    });
    queue();
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
  group('.keys', '.kw', 'anim-pop');
  $$('.keys').forEach(k => k.classList.add('anim-wait'));
  group('.work-grid', '.work-card:nth-child(-n+6)', 'anim-rise');
  $$('.sec-head, .hello h2, .hello-sub, .studio-grid h2, .brief').forEach(el => {
    el.classList.add('anim-rise');
    io.observe(el);
  });
  $$('.hl').forEach(el => { if (el.closest('[data-reveal-words]')) return; el.classList.add('anim-hl'); io.observe(el); });

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
