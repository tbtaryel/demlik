import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id,name,email,phone,role,created_at FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      return res.json([
        { id: 1, name: 'Admin', email: 'admin@example.com', phone: '+905555000001', role: 'admin', created_at: new Date().toISOString() },
        { id: 2, name: 'User', email: 'user@example.com', phone: '+905555000002', role: 'user', created_at: new Date().toISOString() },
      ]);
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/', requireRole(['admin']), async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if ((!email && !phone) || !password) return res.status(400).json({ error: 'email or phone and password required' });
  try {
    if (email) {
      const [existsEmail] = await db.execute('SELECT id FROM users WHERE email=?', [email]);
      if (existsEmail.length) return res.status(409).json({ error: 'Email exists' });
    }
    if (phone) {
      const [existsPhone] = await db.execute('SELECT id FROM users WHERE phone=?', [phone]);
      if (existsPhone.length) return res.status(409).json({ error: 'Phone exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute('INSERT INTO users (name,email,phone,password_hash,role) VALUES (?,?,?,?,?)', [name || '', email || null, phone || null, hash, role || 'user']);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.put('/:id', requireRole(['admin']), async (req, res) => {
  const id = req.params.id;
  const { name, email, phone, role, password } = req.body;
  try {
    if (password && String(password).trim().length) {
      const hash = await bcrypt.hash(password, 10);
      await db.execute('UPDATE users SET name=?,email=?,phone=?,role=?,password_hash=? WHERE id=?', [name || '', email || null, phone || null, role || 'user', hash, id]);
    } else {
      await db.execute('UPDATE users SET name=?,email=?,phone=?,role=? WHERE id=?', [name || '', email || null, phone || null, role || 'user', id]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.delete('/:id', requireRole(['admin']), async (req, res) => {
  const id = req.params.id;
  try {
    await db.execute('DELETE FROM users WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;