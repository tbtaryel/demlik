import { Router } from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    await db.execute('INSERT INTO feedback (user_id, message) VALUES (?,?)', [req.user?.id || null, message]);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT f.id, u.email as user_email, f.message, f.created_at FROM feedback f LEFT JOIN users u ON u.id = f.user_id ORDER BY f.id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;