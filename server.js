const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], history: {} }, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(raw);
    db.users = db.users || [];
    db.history = db.history || {};
    return db;
  } catch (e) {
    return { users: [], history: {} };
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// In-memory sessions: token -> { userId, expiresAt }
const sessions = new Map();

function send(res, status, data, headers = {}) {
  let body = data;
  let contentType = headers['Content-Type'];

  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    if (!contentType) contentType = 'application/octet-stream';
  } else if (typeof data === 'string') {
    if (!contentType) contentType = 'text/plain; charset=utf-8';
  } else {
    body = JSON.stringify(data);
    contentType = headers['Content-Type'] || 'application/json; charset=utf-8';
  }

  res.writeHead(status, {
    ...headers,
    'Content-Type': contentType,
    'Cache-Control': headers['Cache-Control'] || 'no-store'
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) { reject(new Error('Body too large')); req.destroy(); }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString('hex');
}

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getAuthUser(req, db) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1];
  const sess = sessions.get(token);
  if (!sess) return null;
  if (sess.expiresAt < Date.now()) { sessions.delete(token); return null; }
  const user = db.users.find(u => u.id === sess.userId);
  if (!user) return null;
  return { user, token };
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt };
}

function sanitizeHistoryItem(item) {
  const it = item && typeof item === 'object' ? item : {};
  return {
    id: String(it.id || (Date.now() + Math.random().toString(16).slice(2))),
    time: Number(it.time || Date.now()),
    lang: String(it.lang || 'javascript').slice(0, 30),
    health: Math.max(0, Math.min(100, Number(it.health || 0))),
    issues: Math.max(0, Number(it.issues || 0)),
    code: String(it.code || '').slice(0, 20000)
  };
}

async function handleApi(req, res, pathname) {
  const db = readDb();
  const method = req.method.toUpperCase();

  try {
    if (pathname === '/api/auth/signup' && method === 'POST') {
      const body = await parseBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (name.length < 2) return send(res, 400, { error: 'Name must be at least 2 characters.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'Please enter a valid email address.' });
      if (password.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
      if (db.users.some(u => u.email === email)) return send(res, 409, { error: 'An account with this email already exists.' });
      const salt = crypto.randomBytes(16).toString('hex');
      const user = {
        id: 'u_' + crypto.randomBytes(8).toString('hex'),
        name: name.slice(0, 60),
        email,
        salt,
        passwordHash: hashPassword(password, salt),
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      db.history[user.id] = db.history[user.id] || [];
      writeDb(db);
      const token = makeToken();
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 });
      return send(res, 201, { token, user: publicUser(user) });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const user = db.users.find(u => u.email === email);
      if (!user) return send(res, 401, { error: 'Invalid email or password.' });
      const hash = hashPassword(password, user.salt);
      const ok = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
      if (!ok) return send(res, 401, { error: 'Invalid email or password.' });
      const token = makeToken();
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 });
      return send(res, 200, { token, user: publicUser(user) });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const auth = req.headers['authorization'] || '';
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (m) sessions.delete(m[1]);
      return send(res, 200, { ok: true });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const ctx = getAuthUser(req, db);
      if (!ctx) return send(res, 401, { error: 'Not authenticated.' });
      return send(res, 200, { user: publicUser(ctx.user) });
    }

    if (pathname === '/api/history' && method === 'GET') {
      const ctx = getAuthUser(req, db);
      if (!ctx) return send(res, 401, { error: 'Not authenticated.' });
      const items = Array.isArray(db.history[ctx.user.id]) ? db.history[ctx.user.id] : [];
      return send(res, 200, { items });
    }

    if (pathname === '/api/history' && method === 'POST') {
      const ctx = getAuthUser(req, db);
      if (!ctx) return send(res, 401, { error: 'Not authenticated.' });
      const body = await parseBody(req);
      const item = sanitizeHistoryItem(body.item || body);
      const list = Array.isArray(db.history[ctx.user.id]) ? db.history[ctx.user.id] : [];
      // de-dupe by id if provided
      const filtered = list.filter(x => x && x.id !== item.id);
      filtered.unshift(item);
      db.history[ctx.user.id] = filtered.slice(0, 50);
      writeDb(db);
      return send(res, 200, { items: db.history[ctx.user.id] });
    }

    if (pathname === '/api/history' && method === 'DELETE') {
      const ctx = getAuthUser(req, db);
      if (!ctx) return send(res, 401, { error: 'Not authenticated.' });
      db.history[ctx.user.id] = [];
      writeDb(db);
      return send(res, 200, { items: [] });
    }

    return send(res, 404, { error: 'Not found' });
  } catch (e) {
    const msg = e && e.message === 'Invalid JSON' ? 'Invalid JSON body.' : (e && e.message === 'Body too large' ? 'Request too large.' : 'Server error.');
    const status = (e && (e.message === 'Invalid JSON' || e.message === 'Body too large')) ? 400 : 500;
    return send(res, status, { error: msg });
  }
}

function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  // prevent path traversal
  const safePath = path.normalize(rel).replace(/^([/\\])+/, '');
  let filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (err2, data) => {
      if (err2) {
        // SPA-ish fallback not needed, just 404
        return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      send(res, 200, data, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith('/api/')) {
      return await handleApi(req, res, pathname);
    }
    return serveStatic(req, res, pathname);
  } catch (e) {
    return send(res, 500, 'Server error', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

ensureDb();
server.listen(PORT, () => {
  console.log(`CodeSense running at http://localhost:${PORT}`);
  console.log(`- Open this URL in your browser for login/profile history features.`);
  console.log(`- Data is stored in ${DB_FILE}`);
});
