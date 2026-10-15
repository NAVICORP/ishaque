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
  dockInd.style.transform = `translateX(${link.offsetLeft - 7}px)`;
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

/* ---------- hero pins: small sheets about each place ---------- */
const hsheet = $('[data-hsheet-panel]');
if (hsheet) {
  const body = $('[data-hsheet-body]', hsheet);
  const pinsEls = $$('[data-hsheet]');
  let openPin = null;
  let hideTimer;
  const close = () => {
    if (!openPin) return;
    hsheet.classList.remove('is-open');
    openPin.classList.remove('is-on');
    openPin.setAttribute('aria-expanded', 'false');
    openPin = null;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { hsheet.hidden = true; }, 260);
  };
  const open = pin => {
    if (openPin === pin) { close(); return; }
    clearTimeout(hideTimer);
    openPin?.classList.remove('is-on');
    openPin = pin;
    pin.classList.add('is-on');
    pin.setAttribute('aria-expanded', 'true');
    body.replaceChildren($(`#hs-${pin.dataset.hsheet}`).content.cloneNode(true));
    hsheet.hidden = false;
    hsheet.scrollTop = 0;
    hsheet.classList.remove('is-open');
    void hsheet.offsetWidth;
    hsheet.classList.add('is-open');
  };
  pinsEls.forEach(pin => {
    pin.setAttribute('aria-expanded', 'false');
    pin.addEventListener('click', e => { e.stopPropagation(); open(pin); });
  });
  hsheet.addEventListener('click', e => {
    if (e.target.closest('[data-hsheet-close]')) close();
    e.stopPropagation();
  });
  document.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('scroll', () => { if (openPin && scrollY > innerHeight * .6) close(); }, { passive: true });
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
  /* the map's colours come from the CSS variables, with the palette as a
     fallback: a canvas quietly keeps its last colour (black at first) when
     it is handed something it cannot read, which painted the whole map black
     on iPhones where the variables came back empty */
  const PALETTE = {
    light: { land: '#f8f5ee', block: '#e7e1d5', park: '#d2e9c8', water: '#aad3f2', road: '#ffffff', hwy: '#fcde86', hwyC: '#edc458', route: '#2e7dda' },
    dark: { land: '#161e2c', block: '#212b3d', park: '#1c3329', water: '#19314f', road: '#232d40', hwy: '#5c4a1f', hwyC: '#3f3418', route: '#78b2ff' },
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
    colors = { land: v('--m-land', 'land'), block: v('--m-block', 'block'), park: v('--m-park', 'park'), water: v('--m-water', 'water'), road: v('--m-road', 'road'), hwy: v('--m-hwy', 'hwy'), hwyC: v('--m-hwy-c', 'hwyC'), route: v('--route', 'route') };
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
    card.innerHTML = `<div class="jc-in"><div class="jc-top"><span class="jc-tile">${s.icon}</span><p>${esc(s.place)}<span class="jc-meta"><svg class="i" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>${esc(s.meta)}</span></p></div><div class="jc-body"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>${pic}</div>`;
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

/* ---------- selected work: a box of cards ---------- */
const cbox = $('[data-cbox]');
if (cbox) {
  const cards = $$('.ccard', cbox);
  const items = $$('.citem', cbox);
  const list = $('[data-clist]', cbox);
  const scene = $('.cbox-scene', cbox);
  const n = cards.length;
  let active = 0;
  let fromList = false;
  const set = (i, { scrollList = true } = {}) => {
    active = (i + n) % n;
    cards.forEach((c, k) => c.classList.toggle('is-up', k === active));
    items.forEach((it, k) => it.classList.toggle('is-on', k === active));
    if (scrollList && list.scrollWidth > list.clientWidth) {
      fromList = true;
      list.scrollTo({ left: items[active].parentElement.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft), behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(() => { fromList = false; }, 600);
    }
  };
  const openCard = (k, e) => {
    if (e && !plainClick(e)) return;
    e?.preventDefault();
    const card = cards[k];
    set(k);
    card.classList.add('is-open');
    setTimeout(() => { location.href = card.getAttribute('href'); }, reduced ? 0 : 520);
    setTimeout(() => card.classList.remove('is-open'), 1500);
  };
  cards.forEach((c, k) => c.addEventListener('click', e => {
    if (k !== active) { e.preventDefault(); set(k); return; }
    openCard(k, e);
  }));
  items.forEach((it, k) => {
    it.addEventListener('click', e => {
      if (k !== active && list.scrollWidth > list.clientWidth) { e.preventDefault(); set(k); return; }
      openCard(k, e);
    });
    it.addEventListener('mouseenter', () => set(k, { scrollList: false }));
    it.addEventListener('focus', () => set(k, { scrollList: false }));
  });
  /* swiping the list moves the lifted card with it */
  let scrollT;
  list.addEventListener('scroll', () => {
    if (fromList) return;
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      const x = list.scrollLeft;
      let best = 0;
      items.forEach((it, k) => { if (Math.abs(it.parentElement.offsetLeft - list.offsetLeft - x) < Math.abs(items[best].parentElement.offsetLeft - list.offsetLeft - x)) best = k; });
      if (best !== active) set(best, { scrollList: false });
    }, 90);
  }, { passive: true });
  /* swiping the box steps through the cards */
  let sx = null;
  scene.addEventListener('pointerdown', e => { sx = e.clientX; });
  scene.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 40) { scene.dataset.swiped = '1'; set(active + (dx < 0 ? 1 : -1)); }
  });
  scene.addEventListener('click', e => { if (scene.dataset.swiped) { e.preventDefault(); e.stopPropagation(); delete scene.dataset.swiped; } }, true);
  cbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); set(active + 1); items[active].focus({ preventScroll: true }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); set(active - 1); items[active].focus({ preventScroll: true }); }
  });
  /* the cards rise out of the box the first time it comes into view */
  const lift = () => {
    cbox.classList.add('is-in');
    setTimeout(() => { cbox.classList.add('is-ready'); set(0, { scrollList: false }); }, reduced ? 0 : 900);
  };
  if (reduced || !('IntersectionObserver' in window)) lift();
  else {
    const o = new IntersectionObserver(([en]) => { if (en.isIntersecting) { o.disconnect(); lift(); } }, { threshold: .35 });
    o.observe(scene);
  }
}

/* ---------- stack: the gift box ---------- */
const gift = $('[data-gift]');
if (gift && !reduced) {
  const tools = $$('.tool', gift);
  const stage = $('.gift-stage', gift);
  const aim = () => {
    const b = stage.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height * .45;
    tools.forEach((t, i) => {
      t.style.transition = 'none';
      t.style.removeProperty('--fx');
      t.style.removeProperty('--fy');
      const r = t.getBoundingClientRect();
      t.style.setProperty('--fx', `${(cx - (r.left + r.width / 2)).toFixed(0)}px`);
      t.style.setProperty('--fy', `${(cy - (r.top + r.height / 2)).toFixed(0)}px`);
      t.style.setProperty('--ti', String(i));
      void t.offsetWidth;
      t.style.transition = '';
    });
  };
  gift.classList.add('is-wrapped');
  aim();
  addEventListener('resize', () => { if (gift.classList.contains('is-wrapped')) aim(); });
  let auto;
  const unwrap = () => {
    clearTimeout(auto);
    if (!gift.classList.contains('is-wrapped')) return;
    gift.classList.add('is-open');
    gift.classList.remove('is-wrapped');
  };
  $('[data-unwrap]', gift).addEventListener('click', unwrap);
  stage.addEventListener('click', unwrap);
  /* nobody should miss the tools: it opens by itself after a moment in view */
  const o = new IntersectionObserver(([en]) => {
    clearTimeout(auto);
    if (en.isIntersecting) auto = setTimeout(unwrap, 3200);
  }, { threshold: .7 });
  o.observe(stage);
} else if (gift) {
  gift.classList.add('is-open');
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
