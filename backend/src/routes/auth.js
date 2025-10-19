import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

const router = Router();

// Register with phone number and one-time invite code
router.post('/register', async (req, res) => {
  const { phone, password, invite_code } = req.body;
  if (!phone || !password || !invite_code) return res.status(400).json({ error: 'phone, password and invite_code are required' });
  try {
    const [invRows] = await db.execute('SELECT id, is_used, expires_at FROM invites WHERE code=?', [invite_code]);
    if (!invRows.length) return res.status(400).json({ error: 'Invalid invite code' });
    const invite = invRows[0];
    if (invite.is_used) return res.status(400).json({ error: 'Invite code already used' });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return res.status(400).json({ error: 'Invite code expired' });

    const [exists] = await db.execute('SELECT id FROM users WHERE phone=?', [phone]);
    if (exists.length) return res.status(409).json({ error: 'Phone already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute('INSERT INTO users (name,email,phone,password_hash,role) VALUES (?,?,?,?,?)', ['', null, phone, hash, 'user']);
    const id = result.insertId;

    await db.execute('UPDATE invites SET is_used=1, used_by=?, used_at=NOW() WHERE id=?', [id, invite.id]);

    const token = jwt.sign({ id, phone, role: 'user' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ token, user: { id, phone, role: 'user' } });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Login primarily with phone number (fallback to email for admin page)
router.post('/login', async (req, res) => {
  const { phone, email, password } = req.body;
  if ((!phone && !email) || !password) return res.status(400).json({ error: 'phone or email and password required' });
  try {
    // Dev bypass: allow login without DB when enabled
    if (process.env.AUTH_DEV_BYPASS === 'true') {
      const isAdminByEmail = email && email.trim().toLowerCase() === 'admin@example.com' && password === 'admin123';
      const isAdminByPhone = phone && phone.replace(/[^+\d]/g, '') === '+905555000001' && password === 'admin123';
      const isUser = phone && phone.replace(/[^+\d]/g, '') === '+905555000002' && password === 'user123';
      if (isAdminByEmail || isAdminByPhone || isUser) {
        const role = isUser ? 'user' : 'admin';
        const id = role === 'admin' ? 1 : 2;
        const tok = jwt.sign({ id, phone: phone || (isAdminByEmail ? '+905555000001' : undefined), email, role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
        return res.json({ token: tok, user: { id, name: role === 'admin' ? 'Admin' : 'User', phone: phone || (isAdminByEmail ? '+905555000001' : null), email: email || (isAdminByPhone ? 'admin@example.com' : null), role } });
      }
    }

    const where = phone ? 'phone=?' : 'email=?';
    const key = phone || email;
    const [rows] = await db.execute(`SELECT id, name, email, phone, password_hash, role FROM users WHERE ${where}`, [key]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, phone: user.phone, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;