/*
 * ishaquenv.com on the SkiFi server: serves the built site from dist/ and a
 * small API for the visitor count and the wall. No dependencies; data is two
 * JSON files in DATA_DIR (a Docker volume), written atomically.
 *
 *   GET  /api/stats          -> { visitors }
 *   POST /api/visit          -> { visitors }   body { first: true } counts a new browser once
 *   GET  /api/notes          -> { notes: [...] } newest first
 *   POST /api/notes          -> { note }        body { name, work, message, avatar }
 *   DELETE /api/notes/:id    -> 204             header Authorization: Bearer ADMIN_TOKEN
 *   GET  /wall-admin         -> a small page to remove notes and see the visit counts
 *
 * Set NOTIFY_URL to get a message for every new note (a webhook that takes JSON
 * {text}, or a Telegram sendMessage URL with NOTIFY_CHAT as the chat id).
 */
import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { randomUUID, timingSafeEqual, createHmac, randomBytes } from 'node:crypto';
import { createGzip, createBrotliCompress, constants as zc } from 'node:zlib';

const PORT = Number(process.env.PORT || 8000);
const DIST = new URL('../dist/', import.meta.url).pathname;
const DATA = process.env.DATA_DIR || new URL('../.data/', import.meta.url).pathname;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const NOTIFY_URL = process.env.NOTIFY_URL || '';
const NOTIFY_CHAT = process.env.NOTIFY_CHAT || '';
const MAX_NOTES = 500;
const KEEP_IP_DAYS = 30;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.vcf': 'text/vcard; charset=utf-8', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8',
};

/* ---------- storage ---------- */
await mkdir(DATA, { recursive: true });
async function load(name, fallback) {
  try { return JSON.parse(await readFile(join(DATA, name), 'utf8')); } catch { return fallback; }
}
let writing = Promise.resolve();
function save(name, value) {
  writing = writing.then(async () => {
    const tmp = join(DATA, `${name}.${process.pid}.tmp`);
    await writeFile(tmp, JSON.stringify(value));
    await rename(tmp, join(DATA, name));
  }).catch(err => console.error('save failed', name, err));
  return writing;
}
const stats = await load('stats.json', { visitors: 0 });
stats.days ||= {};
stats.refs ||= {};
const notes = await load('notes.json', []);
/* visitor addresses are only ever kept as a keyed hash, and dropped from old notes */
const secret = await load('secret.json', null) || await (async () => { const v = { key: randomBytes(32).toString('hex') }; await save('secret.json', v); return v; })();
const hashIp = ip => createHmac('sha256', secret.key).update(ip).digest('hex').slice(0, 24);
function pruneIps() {
  const cutoff = Date.now() - KEEP_IP_DAYS * 86400000;
  let changed = false;
  for (const n of notes) if (n.ip && Date.parse(n.at) < cutoff) { delete n.ip; changed = true; }
  if (changed) save('notes.json', notes);
}
pruneIps();
setInterval(pruneIps, 6 * 3600000).unref();
function notify(text) {
  if (!NOTIFY_URL) return;
  const body = NOTIFY_CHAT ? { chat_id: NOTIFY_CHAT, text } : { text };
  fetch(NOTIFY_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(err => console.error('notify failed', err.message));
}

/* ---------- small helpers ---------- */
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return true; }
  list.push(now);
  hits.set(key, list);
  return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.every(t => now - t > 86400000)) hits.delete(k); }, 3600000).unref();

const ipOf = req => hashIp(String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim());
const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg)/;
function encoder(req) {
  const ae = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(ae)) return ['br', () => createBrotliCompress({ params: { [zc.BROTLI_PARAM_QUALITY]: 5 } })];
  if (/\bgzip\b/.test(ae)) return ['gzip', () => createGzip({ level: 6 })];
  return null;
}
function send(res, code, body, headers = {}, req = null) {
  const json = typeof body !== 'string';
  const out = json ? JSON.stringify(body) : body;
  const head = { 'content-type': json ? 'application/json' : 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers };
  const enc = req && out.length > 1024 ? encoder(req) : null;
  if (!enc) { res.writeHead(code, head); return res.end(out); }
  res.writeHead(code, { ...head, 'content-encoding': enc[0], vary: 'accept-encoding' });
  const z = enc[1](); z.pipe(res); z.end(out);
}
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw Object.assign(new Error('Too large'), { code: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}
/* only the host of where a visitor came from, never the page or the query string */
function refOf(header, fromBody) {
  const raw = String(fromBody || header || '').trim();
  if (!raw) return '';
  try { const u = new URL(raw); return /ishaquenv\.com$/.test(u.hostname) ? '' : u.hostname.replace(/^www\./, '').slice(0, 60); } catch { return ''; }
}
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function isAdmin(req) {
  if (limited(`admin-fail:${ipOf(req)}`, 10, 3600000)) return false;
  const got = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(ADMIN_TOKEN);
  const ok = ADMIN_TOKEN.length >= 12 && got.length === want.length && timingSafeEqual(got, want);
  if (ok) { const list = hits.get(`admin-fail:${ipOf(req)}`); if (list) list.pop(); }
  return ok;
}
const publicNote = n => ({ id: n.id, name: n.name, work: n.work, message: n.message, avatar: n.avatar, at: n.at });

/* ---------- API ---------- */
async function api(req, res, path) {
  if (path === '/api/stats' && req.method === 'GET') return send(res, 200, { visitors: stats.visitors });

  if (path === '/api/visit' && req.method === 'POST') {
    const body = await readBody(req);
    const day = new Date().toISOString().slice(0, 10);
    stats.days[day] = (stats.days[day] || 0) + 1;
    for (const d of Object.keys(stats.days)) if (Date.parse(d) < Date.now() - 400 * 86400000) delete stats.days[d];
    const ref = refOf(req.headers.referer, body.ref);
    if (ref) stats.refs[ref] = (stats.refs[ref] || 0) + 1;
    if (body.first === true && !limited(`visit:${ipOf(req)}`, 20, 86400000)) stats.visitors += 1;
    save('stats.json', stats);
    return send(res, 200, { visitors: stats.visitors });
  }

  if (path === '/api/notes' && req.method === 'GET') return send(res, 200, { notes: notes.slice(0, 60).map(publicNote) });

  if (path === '/api/notes' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.website) return send(res, 200, { ok: true });
    const name = clean(body.name, 40);
    const work = clean(body.work, 60);
    const message = clean(body.message, 200);
    const avatar = Math.max(0, Math.min(11, Number.parseInt(body.avatar, 10) || 0));
    if (!name || !message) return send(res, 400, { error: 'Add your name and a note.' });
    if (/(https?:\/\/|www\.|\.com\b|\.ru\b)/i.test(`${message} ${work}`)) return send(res, 400, { error: 'Leave links out of the note.' });
    if (limited(`note:${ipOf(req)}`, 3, 3600000)) return send(res, 429, { error: 'That is plenty of notes for now. Try again in an hour.' });
    const note = { id: randomUUID(), name, work, message, avatar, at: new Date().toISOString(), ip: ipOf(req) };
    notes.unshift(note);
    notes.length = Math.min(notes.length, MAX_NOTES);
    save('notes.json', notes);
    notify(`New note on ishaquenv.com\n${name}${work ? ` (${work})` : ''}: ${message}\nRemove it at https://ishaquenv.com/wall-admin`);
    return send(res, 201, { note: publicNote(note) });
  }

  const del = path.match(/^\/api\/notes\/([\w-]{8,})$/);
  if (del && req.method === 'DELETE') {
    if (!isAdmin(req)) return send(res, 401, { error: 'Wrong key.' });
    const i = notes.findIndex(n => n.id === del[1]);
    if (i >= 0) { notes.splice(i, 1); save('notes.json', notes); }
    return send(res, 204, '');
  }
  if (path === '/api/admin/notes' && req.method === 'GET') {
    if (!isAdmin(req)) return send(res, 401, { error: 'Wrong key.' });
    return send(res, 200, { notes: notes.map(publicNote) });
  }
  if (path === '/api/admin/stats' && req.method === 'GET') {
    if (!isAdmin(req)) return send(res, 401, { error: 'Wrong key.' });
    const days = Object.entries(stats.days).sort().slice(-30);
    const refs = Object.entries(stats.refs).sort((a, b) => b[1] - a[1]).slice(0, 15);
    return send(res, 200, { visitors: stats.visitors, days, refs });
  }
  return send(res, 404, { error: 'Not found' });
}

const ADMIN_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Wall admin</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#142640;background:#fff7ea}h1{font-size:28px}input,button{font:inherit;padding:10px 14px;border-radius:12px;border:1px solid #d9cfbd}button{background:#142640;color:#fff;border:0;cursor:pointer}li{list-style:none;background:#fff;border-radius:16px;padding:14px 16px;margin:10px 0;display:flex;gap:12px;justify-content:space-between;align-items:flex-start}small{color:#4e6077}ul{padding:0}</style></head>
<body><h1>Wall admin</h1><form id="f"><input id="k" type="password" placeholder="Admin key" autocomplete="current-password"> <button>Show notes</button></form><p id="s"></p><section id="st" hidden><h2 style="font-size:20px">Visits</h2><p id="sv"></p><div id="sd" style="display:flex;align-items:flex-end;gap:3px;height:80px;margin:8px 0"></div><p id="sr" style="font-size:14px"></p></section><ul id="l"></ul>
<script>
const f=document.getElementById('f'),k=document.getElementById('k'),l=document.getElementById('l'),s=document.getElementById('s');
k.value=sessionStorage.getItem('wk')||'';
async function load(){const r=await fetch('/api/admin/notes',{headers:{authorization:'Bearer '+k.value}});if(!r.ok){s.textContent='That key did not work.';return}sessionStorage.setItem('wk',k.value);stats();const {notes}=await r.json();s.textContent=notes.length+' notes';l.replaceChildren(...notes.map(n=>{const li=document.createElement('li');const d=document.createElement('div');d.innerHTML='<b></b> <small></small><div></div>';d.querySelector('b').textContent=n.name;d.querySelector('small').textContent=(n.work?n.work+', ':'')+new Date(n.at).toLocaleString();d.querySelector('div').textContent=n.message;const b=document.createElement('button');b.textContent='Remove';b.onclick=async()=>{const r=await fetch('/api/notes/'+n.id,{method:'DELETE',headers:{authorization:'Bearer '+k.value}});if(r.ok)li.remove()};li.append(d,b);return li}))}
async function stats(){const r=await fetch('/api/admin/stats',{headers:{authorization:'Bearer '+k.value}});if(!r.ok)return;const d=await r.json();const st=document.getElementById('st');st.hidden=false;document.getElementById('sv').textContent=d.visitors+' visitors counted, '+d.days.reduce((a,x)=>a+x[1],0)+' visits in the last '+d.days.length+' days';const max=Math.max(1,...d.days.map(x=>x[1]));document.getElementById('sd').replaceChildren(...d.days.map(([day,n])=>{const b=document.createElement('i');b.title=day+': '+n;b.style.cssText='flex:1;background:#2a7bd1;border-radius:3px 3px 0 0;height:'+Math.max(3,Math.round(n/max*80))+'px';return b}));document.getElementById('sr').textContent=d.refs.length?'From: '+d.refs.map(([h,n])=>h+' ('+n+')').join(', '):'No referrers yet.'}
f.onsubmit=e=>{e.preventDefault();load()};if(k.value)load();
</script></body></html>`;

/* ---------- static files ---------- */
async function file(req, res, path) {
  let rel = decodeURIComponent(path);
  if (rel.endsWith('/')) rel += 'index.html';
  rel = normalize(rel).replace(/^(\.\.[/\\])+/, '');
  const candidates = extname(rel) ? [rel] : [`${rel}.html`, `${rel}/index.html`];
  for (const c of candidates) {
    const full = join(DIST, c);
    if (!full.startsWith(DIST)) break;
    try {
      const s = await stat(full);
      if (!s.isFile()) continue;
      const ext = extname(c);
      const type = TYPES[ext] || 'application/octet-stream';
      const hashed = c.startsWith('/assets/') && /-[\w-]{8}\.(js|css)$/.test(c);
      const enc = COMPRESSIBLE.test(type) && s.size > 1024 ? encoder(req) : null;
      const head = {
        'content-type': type,
        'cache-control': hashed ? 'public, max-age=31536000, immutable' : c.endsWith('.html') ? 'no-cache' : /\.(webp|png|jpg|jpeg|svg|ico|woff2|pdf)$/.test(c) ? 'public, max-age=604800, stale-while-revalidate=86400' : 'public, max-age=3600',
        'x-content-type-options': 'nosniff',
        vary: 'accept-encoding',
      };
      if (!enc) head['content-length'] = s.size; else head['content-encoding'] = enc[0];
      res.writeHead(200, head);
      if (req.method === 'HEAD') return res.end();
      const stream = createReadStream(full);
      return enc ? stream.pipe(enc[1]()).pipe(res) : stream.pipe(res);
    } catch { /* try the next one */ }
  }
  try {
    const page = await readFile(join(DIST, '404.html'), 'utf8');
    return send(res, 404, page);
  } catch {
    send(res, 404, '<!doctype html><meta charset="utf-8"><title>Not found</title><p style="font:18px system-ui;padding:40px">This page is not here. <a href="/">Go home</a>.</p>');
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  try {
    if (pathname.startsWith('/api/')) return await api(req, res, pathname);
    if (pathname === '/wall-admin') return send(res, 200, ADMIN_PAGE, { 'x-robots-tag': 'noindex' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    if (pathname.length > 1 && pathname.endsWith('.html')) {
      res.writeHead(301, { location: pathname.replace(/\/?index\.html$|\.html$/, '') || '/' });
      return res.end();
    }
    return await file(req, res, pathname);
  } catch (err) {
    if (err.code === 413) return send(res, 413, { error: 'Too large' });
    console.error(err);
    send(res, 500, { error: 'Something went wrong.' });
  }
}).listen(PORT, () => console.log(`ishaquenv.com on :${PORT}, data in ${DATA}`));
