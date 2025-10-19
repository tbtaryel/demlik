import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { db } from '../config/db.js';

const router = Router();
router.use(requireAuth);

// List available block trade securities
router.get('/securities', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, symbol, name, buy_price, min_qty, created_at FROM block_securities ORDER BY id ASC'
    );
    return res.json(rows);
  } catch (e) {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return res.json([
        { id: 1, symbol: 'GARAN', name: 'Garanti BBVA', buy_price: 67.5, min_qty: 1000, created_at: new Date().toISOString() },
        { id: 2, symbol: 'ASELS', name: 'Aselsan', buy_price: 52.1, min_qty: 500, created_at: new Date().toISOString() },
        { id: 3, symbol: 'BIMAS', name: 'BİM', buy_price: 485.0, min_qty: 100, created_at: new Date().toISOString() },
      ]);
    }
    if (e?.code === 'ER_NO_SUCH_TABLE') return res.json([]);
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// List current/previous block trades
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, symbol, price, qty, (price*qty) as turnover, status, created_at FROM block_trades ORDER BY id DESC'
    );
    return res.json(rows);
  } catch (e) {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      const sample = [
        { id: 101, symbol: 'GARAN', price: 67.5, qty: 5000, turnover: 67.5*5000, status: 'open', created_at: new Date().toISOString() },
        { id: 102, symbol: 'ASELS', price: 52.1, qty: 3000, turnover: 52.1*3000, status: 'closed', created_at: new Date().toISOString() },
        { id: 103, symbol: 'BIMAS', price: 485.0, qty: 200, turnover: 485.0*200, status: 'open', created_at: new Date().toISOString() },
      ];
      return res.json(sample);
    }
    if (e?.code === 'ER_NO_SUCH_TABLE') return res.json([]);
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: add a security row
router.post('/admin/securities', requireRole(['admin']), async (req, res) => {
  const { symbol, name, buy_price, min_qty } = req.body || {};
  if (!symbol || !buy_price || !min_qty) return res.status(400).json({ error: 'symbol, buy_price, min_qty required' });
  try {
    const [r] = await db.query(
      'INSERT INTO block_securities (symbol, name, buy_price, min_qty) VALUES (?,?,?,?)',
      [String(symbol), name || null, Number(buy_price), Number(min_qty)]
    );
    return res.status(201).json({ id: r.insertId });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: update a security
router.put('/admin/securities/:id', requireRole(['admin']), async (req, res) => {
  const { symbol, name, buy_price, min_qty } = req.body || {};
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    await db.query(
      'UPDATE block_securities SET symbol=?, name=?, buy_price=?, min_qty=? WHERE id=?',
      [String(symbol), name || null, Number(buy_price), Number(min_qty), id]
    );
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: delete a security
router.delete('/admin/securities/:id', requireRole(['admin']), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    await db.query('DELETE FROM block_securities WHERE id=?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: add a block trade listing
router.post('/admin/list', requireRole(['admin']), async (req, res) => {
  const { symbol, price, qty, status } = req.body || {};
  if (!symbol || !price || !qty) return res.status(400).json({ error: 'symbol, price, qty required' });
  const st = (status || 'open').toLowerCase();
  try {
    const [r] = await db.query(
      'INSERT INTO block_trades (symbol, price, qty, status) VALUES (?,?,?,?)',
      [String(symbol), Number(price), Number(qty), st]
    );
    return res.status(201).json({ id: r.insertId });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: update a block trade listing
router.put('/admin/list/:id', requireRole(['admin']), async (req, res) => {
  const { symbol, price, qty, status } = req.body || {};
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    await db.query(
      'UPDATE block_trades SET symbol=?, price=?, qty=?, status=? WHERE id=?',
      [String(symbol), Number(price), Number(qty), (status || 'open').toLowerCase(), id]
    );
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

// Admin: delete a block trade listing
router.delete('/admin/list/:id', requireRole(['admin']), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    await db.query('DELETE FROM block_trades WHERE id=?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', details: e.message });
  }
});

export default router;