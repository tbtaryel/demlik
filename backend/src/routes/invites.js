import { Router } from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth, requireRole(['admin']));

function genCode() {
  return crypto.randomBytes(6).toString('hex'); // 12 hex chars
}

// List invites
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, code, is_used, used_by, created_by, created_at, used_at, expires_at FROM invites ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Create invite
router.post('/', async (req, res) => {
  const { code, expires_at } = req.body || {};
  const c = code || genCode();
  try {
    await db.execute('INSERT INTO invites (code, created_by, expires_at) VALUES (?,?,?)', [c, req.user.id, expires_at || null]);
    res.status(201).json({ code: c });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Code exists' });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;