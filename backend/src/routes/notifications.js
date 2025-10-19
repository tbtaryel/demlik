import { Router } from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, title, message, created_at FROM notifications ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const { title, message } = req.body;
  try {
    const [result] = await db.execute('INSERT INTO notifications (title, message) VALUES (?,?)', [title, message]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;