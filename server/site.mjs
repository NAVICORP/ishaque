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
 *   GET  /wall-admin         -> a small page to remove notes
 */
import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { randomUUID, timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT || 8000);
const DIST = new URL('../dist/', import.meta.url).pathname;
const DATA = process.env.DATA_DIR || new URL('../.data/', import.meta.url).pathname;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const MAX_NOTES = 500;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
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
const notes = await load('notes.json', []);

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

const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
function send(res, code, body, headers = {}) {
  const json = typeof body !== 'string';
  res.writeHead(code, { 'content-type': json ? 'application/json' : 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(json ? JSON.stringify(body) : body);
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
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function isAdmin(req) {
  const got = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(ADMIN_TOKEN);
  return ADMIN_TOKEN.length >= 12 && got.length === want.length && timingSafeEqual(got, want);
}
const publicNote = n => ({ id: n.id, name: n.name, work: n.work, message: n.message, avatar: n.avatar, at: n.at });

/* ---------- API ---------- */
async function api(req, res, path) {
  if (path === '/api/stats' && req.method === 'GET') return send(res, 200, { visitors: stats.visitors });

  if (path === '/api/visit' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.first === true && !limited(`visit:${ipOf(req)}`, 20, 86400000)) {
      stats.visitors += 1;
      save('stats.json', stats);
    }
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
    return send(res, 200, { notes });
  }
  return send(res, 404, { error: 'Not found' });
}

const ADMIN_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Wall admin</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#142640;background:#fff7ea}h1{font-size:28px}input,button{font:inherit;padding:10px 14px;border-radius:12px;border:1px solid #d9cfbd}button{background:#142640;color:#fff;border:0;cursor:pointer}li{list-style:none;background:#fff;border-radius:16px;padding:14px 16px;margin:10px 0;display:flex;gap:12px;justify-content:space-between;align-items:flex-start}small{color:#4e6077}ul{padding:0}</style></head>
<body><h1>Wall admin</h1><form id="f"><input id="k" type="password" placeholder="Admin key" autocomplete="current-password"> <button>Show notes</button></form><p id="s"></p><ul id="l"></ul>
<script>
const f=document.getElementById('f'),k=document.getElementById('k'),l=document.getElementById('l'),s=document.getElementById('s');
k.value=sessionStorage.getItem('wk')||'';
async function load(){const r=await fetch('/api/admin/notes',{headers:{authorization:'Bearer '+k.value}});if(!r.ok){s.textContent='That key did not work.';return}sessionStorage.setItem('wk',k.value);const {notes}=await r.json();s.textContent=notes.length+' notes';l.replaceChildren(...notes.map(n=>{const li=document.createElement('li');const d=document.createElement('div');d.innerHTML='<b></b> <small></small><div></div>';d.querySelector('b').textContent=n.name;d.querySelector('small').textContent=(n.work?n.work+', ':'')+new Date(n.at).toLocaleString();d.querySelector('div').textContent=n.message;const b=document.createElement('button');b.textContent='Remove';b.onclick=async()=>{const r=await fetch('/api/notes/'+n.id,{method:'DELETE',headers:{authorization:'Bearer '+k.value}});if(r.ok)li.remove()};li.append(d,b);return li}))}
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
      const hashed = c.startsWith('/assets/') && /-[\w-]{8}\.(js|css)$/.test(c);
      res.writeHead(200, {
        'content-type': TYPES[extname(c)] || 'application/octet-stream',
        'content-length': s.size,
        'cache-control': hashed ? 'public, max-age=31536000, immutable' : c.endsWith('.html') ? 'no-cache' : 'public, max-age=86400',
        'x-content-type-options': 'nosniff',
      });
      if (req.method === 'HEAD') return res.end();
      return createReadStream(full).pipe(res);
    } catch { /* try the next one */ }
  }
  send(res, 404, '<!doctype html><meta charset="utf-8"><title>Not found</title><p style="font:18px system-ui;padding:40px">This page is not here. <a href="/">Go home</a>.</p>');
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
