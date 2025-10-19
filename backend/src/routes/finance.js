import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { db } from '../config/db.js';

const router = Router();
router.use(requireAuth);

// Wallet Accounts
router.get('/accounts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, bank_name, account_name, iban, created_at FROM wallet_accounts WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE' || err?.code === 'ECONNREFUSED' || err?.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to list accounts', details: err.message });
  }
});

router.post('/accounts', async (req, res) => {
  const { bank_name, account_name, iban } = req.body || {};
  if (!bank_name || !account_name || !iban) {
    return res.status(400).json({ error: 'bank_name, account_name and iban are required' });
  }
  try {
    const [r] = await db.query(
      'INSERT INTO wallet_accounts (user_id, bank_name, account_name, iban) VALUES (?, ?, ?, ?)',
      [req.user.id, bank_name, account_name, iban]
    );
    const inserted = { id: r.insertId, bank_name, account_name, iban };
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add account', details: err.message });
  }
});

router.delete('/accounts/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  try {
    const [r] = await db.query('DELETE FROM wallet_accounts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account', details: err.message });
  }
});

// Wallet Transactions
router.get('/transactions', async (req, res) => {
  try {
    const type = req.query.type;
    let sql = 'SELECT id, type, amount, status, reference, notes, created_at, updated_at FROM wallet_transactions WHERE user_id = ?';
    const params = [req.user.id];
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE' || err?.code === 'ECONNREFUSED' || err?.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to list transactions', details: err.message });
  }
});

router.post('/transactions', async (req, res) => {
  const { type, amount, reference, notes } = req.body || {};
  if (!type || !['deposit', 'withdraw', 'credit'].includes(type)) {
    return res.status(400).json({ error: 'type must be deposit, withdraw or credit' });
  }
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
  try {
    const [r] = await db.query(
      'INSERT INTO wallet_transactions (user_id, type, amount, status, reference, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, type, amt, 'pending', reference || null, notes || null]
    );
    res.status(201).json({ id: r.insertId, type, amount: amt, status: 'pending', reference, notes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction', details: err.message });
  }
});

// Admin: list all transactions with optional filters
router.get('/admin/transactions', requireRole(['admin']), async (req, res) => {
  try {
    const type = req.query.type ? String(req.query.type) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const userId = req.query.user_id ? Number(req.query.user_id) : null;
    const limit = Number(req.query.limit || 200);
    let sql = `SELECT t.id, t.user_id, COALESCE(NULLIF(u.name,''), u.phone, u.email) AS display_name, t.type, t.amount, t.status, t.reference, t.notes, t.created_at, t.updated_at \n               FROM wallet_transactions t LEFT JOIN users u ON u.id = t.user_id`;
    const params = [];
    const conds = [];
    if (type) { conds.push('t.type = ?'); params.push(type); }
    if (status) { conds.push('t.status = ?'); params.push(status); }
    if (userId) { conds.push('t.user_id = ?'); params.push(userId); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY t.created_at DESC LIMIT ' + limit;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    if (err?.code === 'ER_NO_SUCH_TABLE' || err?.code === 'ECONNREFUSED' || err?.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
      return res.json([]);
    }
    res.status(500).json({ error: 'Failed to list transactions', details: err.message });
  }
});

// Admin can approve/reject transactions (optional)
router.put('/admin/transactions/:id', requireRole(['admin']), async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const [r] = await db.query('UPDATE wallet_transactions SET status = ? WHERE id = ?', [status, id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction', details: err.message });
  }
});

export default router;