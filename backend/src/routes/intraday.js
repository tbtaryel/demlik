import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { db } from '../config/db.js';

const router = Router();
router.use(requireAuth);

// ===== Settings =====
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM intraday_settings ORDER BY id ASC LIMIT 1');
    return res.json(rows?.[0] || {});
  } catch (e) {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return res.json({
        title_label: 'Fonlara katılmak',
        amount_placeholder: 'Lütfen tutarı giriniz',
        submit_label: 'Kaydet',
        guide_text: '',
        active: 1,
      });
    }
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.put('/admin/settings', requireRole(['admin']), async (req, res) => {
  try {
    const b = req.body || {};
    const title_label = b.title_label ?? 'Fonlara katılmak';
    const amount_placeholder = b.amount_placeholder ?? 'Lütfen tutarı giriniz';
    const submit_label = b.submit_label ?? 'Kaydet';
    const guide_text = b.guide_text ?? null;
    const active = b.active ? 1 : 0;
    await db.query(
      `INSERT INTO intraday_settings (id, title_label, amount_placeholder, submit_label, guide_text, active)
       VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title_label=VALUES(title_label),
         amount_placeholder=VALUES(amount_placeholder),
         submit_label=VALUES(submit_label),
         guide_text=VALUES(guide_text),
         active=VALUES(active)`,
      [title_label, amount_placeholder, submit_label, guide_text, active]
    );
    const [rows] = await db.query('SELECT * FROM intraday_settings ORDER BY id ASC LIMIT 1');
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// ===== Orders =====
router.get('/orders', async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    let sql = 'SELECT * FROM intraday_orders';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ' + limit;
    const [rows] = await db.query(sql, params);
    return res.json(rows || []);
  } catch (e) {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return res.json([]);
    }
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const b = req.body || {};
    const amount = Number(b.amount);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'amount_required' });
    await db.query('INSERT INTO intraday_orders (amount, status) VALUES (?, ?)', [amount, 'pending']);
    const [rows] = await db.query('SELECT * FROM intraday_orders ORDER BY id DESC LIMIT 1');
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.put('/admin/orders/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_required' });
    const b = req.body || {};
    const fields = [];
    const values = [];
    const add = (k, v) => { fields.push(`${k} = ?`); values.push(v); };
    if (b.amount != null) add('amount', b.amount);
    if (b.status != null) add('status', b.status);
    if (b.application_time != null) add('application_time', b.application_time);
    if (b.review_time != null) add('review_time', b.review_time);
    if (typeof b.active === 'boolean') add('active', b.active ? 1 : 0);
    if (!fields.length) return res.status(400).json({ error: 'nothing_to_update' });
    values.push(id);
    await db.query(`UPDATE intraday_orders SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM intraday_orders WHERE id = ? LIMIT 1', [id]);
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.delete('/admin/orders/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_required' });
    await db.query('DELETE FROM intraday_orders WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// ===== Operations =====
router.get('/operations', async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    let sql = 'SELECT * FROM intraday_operations';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ' + limit;
    const [rows] = await db.query(sql, params);
    return res.json(rows || []);
  } catch (e) {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return res.json([]);
    }
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.get('/operations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT * FROM intraday_operations WHERE id = ? LIMIT 1', [id]);
    return res.json(rows?.[0] || {});
  } catch (e) {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return res.json({});
    }
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.post('/admin/operations', requireRole(['admin']), async (req, res) => {
  try {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title_required' });
    const status = b.status ?? 'pending';
    const details_json = b.details_json ?? null;
    const active = b.active ? 1 : 0;
    await db.query(
      'INSERT INTO intraday_operations (title, status, details_json, active) VALUES (?, ?, ?, ?)',
      [title, status, details_json, active]
    );
    const [rows] = await db.query('SELECT * FROM intraday_operations ORDER BY id DESC LIMIT 1');
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.put('/admin/operations/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_required' });
    const b = req.body || {};
    const fields = [];
    const values = [];
    const add = (k, v) => { fields.push(`${k} = ?`); values.push(v); };
    if (b.title != null) add('title', b.title);
    if (b.status != null) add('status', b.status);
    if (b.details_json != null) add('details_json', b.details_json);
    if (typeof b.active === 'boolean') add('active', b.active ? 1 : 0);
    if (!fields.length) return res.status(400).json({ error: 'nothing_to_update' });
    values.push(id);
    await db.query(`UPDATE intraday_operations SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT * FROM intraday_operations WHERE id = ? LIMIT 1', [id]);
    return res.json(rows?.[0] || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

router.delete('/admin/operations/:id', requireRole(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id_required' });
    await db.query('DELETE FROM intraday_operations WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

export default router;