import { Router } from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';

const router = Router();
router.use(requireAuth);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve('uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

async function getPrimaryAdminId() {
  const [rows] = await db.execute('SELECT id FROM users WHERE role="admin" ORDER BY id ASC LIMIT 1');
  return rows.length ? rows[0].id : null;
}

// Upload attachment
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const mime = req.file.mimetype || 'application/octet-stream';
    const type = mime.startsWith('image/') ? 'image' : 'file';
    res.json({ url, type, name: req.file.originalname, size: req.file.size });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// Get current user's direct chat with admin
router.get('/my', async (req, res) => {
  try {
    const adminId = await getPrimaryAdminId();
    if (!adminId) return res.status(500).json({ error: 'No admin user found' });
    const userId = req.user.id;
    const [rows] = await db.execute(
      'SELECT m.id, m.sender_id, m.receiver_id, m.body, m.status, m.prev_body, m.created_at, m.updated_at, m.edited_at, m.deleted_at, m.recalled_at FROM messages m WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?) ORDER BY m.created_at ASC',
      [userId, adminId, adminId, userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Admin: list conversations with users (distinct users having messages)
router.get('/conversations', requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id AS user_id, COALESCE(NULLIF(u.name,''), u.phone, u.email) AS display_name,
              MAX(m.created_at) AS last_at
         FROM users u
         JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
        WHERE u.role <> 'admin'
        GROUP BY u.id, display_name
        ORDER BY last_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Admin: get messages for a given user conversation
router.get('/messages', requireRole(['admin']), async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id required' });
  try {
    const adminId = req.user.id; // the calling admin
    const [rows] = await db.execute(
      'SELECT m.id, m.sender_id, m.receiver_id, m.body, m.status, m.prev_body, m.created_at, m.updated_at, m.edited_at, m.deleted_at, m.recalled_at FROM messages m WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?) ORDER BY m.created_at ASC',
      [userId, adminId, adminId, userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Admin: mute/unmute
router.get('/admin/mute-status', requireRole(['admin']), async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id required' });
  try {
    const [rows] = await db.execute('SELECT chat_muted FROM users WHERE id=?', [userId]);
    const muted = rows.length ? Number(rows[0].chat_muted) === 1 : 0;
    res.json({ muted });
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') return res.json({ muted: 0 });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});
router.post('/admin/mute', requireRole(['admin']), async (req, res) => {
  const userId = Number(req.body?.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id required' });
  try {
    await db.execute('UPDATE users SET chat_muted=1 WHERE id=?', [userId]);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') return res.status(501).json({ error: 'Mute not supported; run migration to add chat_muted' });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});
router.post('/admin/unmute', requireRole(['admin']), async (req, res) => {
  const userId = Number(req.body?.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id required' });
  try {
    await db.execute('UPDATE users SET chat_muted=0 WHERE id=?', [userId]);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') return res.status(501).json({ error: 'Mute not supported; run migration to add chat_muted' });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Send a message
router.post('/', async (req, res) => {
  const { body, receiver_id } = req.body || {};
  if (!body || String(body).trim() === '') return res.status(400).json({ error: 'Message body required' });
  try {
    const senderId = req.user.id;

    // if user is muted, block sending
    if (req.user.role === 'user') {
      try {
        const [rows2] = await db.execute('SELECT chat_muted FROM users WHERE id=?', [senderId]);
        const muted = rows2.length ? Number(rows2[0].chat_muted) === 1 : 0;
        if (muted) return res.status(403).json({ error: 'Sohbet hakkınız kısıtlandı' });
      } catch (err2) {
        if (err2.code !== 'ER_BAD_FIELD_ERROR') {
          console.warn('Mute check failed:', err2.message);
        }
      }
    }

    let toId = Number(receiver_id) || null;
    if (!toId) {
      // If normal user sends, route to primary admin; if admin sends, require receiver_id
      if (req.user.role === 'user') {
        const adminId = await getPrimaryAdminId();
        if (!adminId) return res.status(500).json({ error: 'No admin user found' });
        toId = adminId;
      } else {
        return res.status(400).json({ error: 'receiver_id required for admin' });
      }
    }
    const [result] = await db.execute(
      'INSERT INTO messages (sender_id, receiver_id, body) VALUES (?,?,?)',
      [senderId, toId, body]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Edit a message
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { body } = req.body || {};
  if (!id || !body) return res.status(400).json({ error: 'id and body required' });
  try {
    const [rows] = await db.execute('SELECT id, sender_id, body, status FROM messages WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Message not found' });
    const msg = rows[0];
    const isOwner = msg.sender_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await db.execute(
      'UPDATE messages SET prev_body=?, body=?, status="edited", edited_at=NOW() WHERE id=?',
      [msg.body, body, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Soft delete a message
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const [rows] = await db.execute('SELECT id, sender_id FROM messages WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Message not found' });
    const msg = rows[0];
    const isOwner = msg.sender_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await db.execute('UPDATE messages SET status="deleted", deleted_at=NOW() WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Recall a message (sender or admin)
router.post('/:id/recall', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const [rows] = await db.execute('SELECT id, sender_id FROM messages WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Message not found' });
    const msg = rows[0];
    const isOwner = msg.sender_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    await db.execute('UPDATE messages SET status="recalled", recalled_at=NOW() WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;