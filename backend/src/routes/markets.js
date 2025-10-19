import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { db } from '../config/db.js';

const router = Router();
router.use(requireAuth);

async function proxyJson(res, url) {
  try {
    const r = await fetch(url, { headers: { 'accept': 'application/json' } });
    const contentType = r.headers.get('content-type') || '';
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      const upstreamStatus = r.status;
      const mappedStatus = (upstreamStatus === 401 || upstreamStatus === 403) ? 502 : upstreamStatus;
      return res.status(mappedStatus).json({ error: 'Upstream error', upstream_status: upstreamStatus, body: text });
    }
    if (contentType.includes('application/json')) {
      const json = await r.json();
      return res.json(json);
    }
    const text = await r.text();
    return res.send(text);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy failure', details: err.message });
  }
}

// BIST Endeks Listesi
router.get('/bist/indexes', async (req, res) => {
  const url = 'https://web-paragaranti-pubsub.foreks.com/web-services/securities/exchanges/BIST/groups/E';
  return proxyJson(res, url);
});

// BIST Endeks Alfabetik Detaylı Liste
router.get('/bist/alphabetic', async (req, res) => {
  const key = encodeURIComponent(String(req.query.key || 'A'));
  const url = `https://web-paragaranti-pubsub.foreks.com/web-services/securities?key=${key}&index=&exchangeGroupFilter=BIST.E&extendedResult=true`;
  return proxyJson(res, url);
});

// BIST Endeks Detayı
router.get('/bist/indexes/:name', async (req, res) => {
  const name = encodeURIComponent(req.params.name);
  const url = `https://web-paragaranti-pubsub.foreks.com/web-services/securities/definition?name=${name}&group=E&exchange=BIST`;
  return proxyJson(res, url);
});

// Bigpara alternatif: Hisse Listesi
router.get('/bigpara/stocks', async (req, res) => {
  const url = 'http://bigpara.hurriyet.com.tr/api/v1/hisse/list';
  return proxyJson(res, url);
});

// Bigpara alternatif: Hisse Detay
router.get('/bigpara/stocks/:code', async (req, res) => {
  const code = encodeURIComponent(req.params.code);
  const url = `http://bigpara.hurriyet.com.tr/api/v1/borsa/hisseyuzeysel/${code}`;
  return proxyJson(res, url);
});

// Midas: BIST tablo verisi
router.get('/midas/table', async (req, res) => {
  const url = 'https://www.getmidas.com/wp-json/midas-api/v1/midas_table_data?sortId=&return=table';
  return proxyJson(res, url);
});

// ===== Admin-managed Market Config & Recommended Stocks =====
// Public (auth required by router): read index config for given index (default XU100)
router.get('/index-config', async (req, res) => {
  try {
    const code = String(req.query.code || 'XU100');
    const [rows] = await db.query('SELECT * FROM market_index_config WHERE index_code = ? LIMIT 1', [code]);
    const cfg = rows?.[0] || null;
    return res.json(cfg || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: upsert index config
router.put('/admin/index-config', requireRole(['admin']), async (req, res) => {
  try {
    const body = req.body || {};
    const code = String(body.index_code || 'XU100');
    const title = body.title ?? 'XU100';
    const enabled = body.enabled ? 1 : 0;
    const color = body.color ?? '#7b1e21';
    const step_ms = Number(body.step_ms ?? 10000);
    const series_json = body.series_json ?? null;
    const high = body.high ?? null;
    const low = body.low ?? null;
    const prev_close = body.prev_close ?? null;
    await db.query(
      `INSERT INTO market_index_config (index_code, title, enabled, color, step_ms, series_json, high, low, prev_close)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), enabled=VALUES(enabled), color=VALUES(color), step_ms=VALUES(step_ms), series_json=VALUES(series_json), high=VALUES(high), low=VALUES(low), prev_close=VALUES(prev_close)`,
      [code, title, enabled, color, step_ms, series_json, high, low, prev_close]
    );
    const [rows] = await db.query('SELECT * FROM market_index_config WHERE index_code = ? LIMIT 1', [code]);
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Public (auth required): list active recommended stocks
router.get('/recommended', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM recommended_stocks WHERE active = 1 ORDER BY sort_order ASC, id ASC');
    return res.json(rows || []);
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: CRUD for recommended stocks
router.get('/admin/recommended-stocks', requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM recommended_stocks ORDER BY sort_order ASC, id ASC');
    return res.json(rows || []);
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.post('/admin/recommended-stocks', requireRole(['admin']), async (req, res) => {
  try {
    const b = req.body || {};
    const code = String(b.code || '').trim();
    const name = String(b.name || code || '').trim();
    if (!code) return res.status(400).json({ error: 'code_required' });
    const last = b.last ?? null;
    const change_percent = b.change_percent ?? null;
    const series_json = b.series_json ?? null;
    const sort_order = Number(b.sort_order ?? 0);
    const active = b.active ? 1 : 0;
    await db.query(
      'INSERT INTO recommended_stocks (code, name, last, change_percent, series_json, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, name, last, change_percent, series_json, sort_order, active]
    );
    const [rows] = await db.query('SELECT * FROM recommended_stocks WHERE code = ? LIMIT 1', [code]);
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.put('/admin/recommended-stocks/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_required' });
    const b = req.body || {};
    const code = b.code ?? null;
    const name = b.name ?? null;
    const last = b.last ?? null;
    const change_percent = b.change_percent ?? null;
    const series_json = b.series_json ?? null;
    const sort_order = b.sort_order ?? null;
    const active = (typeof b.active === 'boolean') ? (b.active ? 1 : 0) : null;
    // Build dynamic update
    const fields = [];
    const values = [];
    const add = (k, v) => { fields.push(`${k} = ?`); values.push(v); };
    if (code != null) add('code', code);
    if (name != null) add('name', name);
    if (last != null) add('last', last);
    if (change_percent != null) add('change_percent', change_percent);
    if (series_json != null) add('series_json', series_json);
    if (sort_order != null) add('sort_order', sort_order);
    if (active != null) add('active', active);
    if (!fields.length) return res.status(400).json({ error: 'nothing_to_update' });
    values.push(id);
    await db.query(`UPDATE recommended_stocks SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM recommended_stocks WHERE id = ? LIMIT 1', [id]);
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.delete('/admin/recommended-stocks/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_required' });
    await db.query('DELETE FROM recommended_stocks WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

export default router;