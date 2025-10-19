import { Router } from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { listContent, getContentBySlug, addContent, updateContent, deleteContent } from '../config/devContent.js';

const router = Router();
router.use(requireAuth);

const DEV_BYPASS = String(process.env.AUTH_DEV_BYPASS || '').toLowerCase() === 'true';

router.get('/', async (req, res) => {
  if (DEV_BYPASS) {
    return res.json(listContent());
  }
  try {
    const [rows] = await db.execute('SELECT id, title, slug, body, image_url, published, created_at, updated_at FROM content ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;
  if (DEV_BYPASS) {
    const it = getContentBySlug(slug);
    if (!it) return res.status(404).json({ error: 'Not found' });
    return res.json(it);
  }
  try {
    const [rows] = await db.execute('SELECT id, title, slug, body, image_url, published, created_at, updated_at FROM content WHERE slug=?', [slug]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/', requireRole(['admin']), async (req, res) => {
  const { title, slug, body, image_url, published } = req.body;
  if (DEV_BYPASS) {
    try {
      const result = addContent({ title, slug, body, image_url, published });
      return res.status(201).json(result);
    } catch (err) {
      if (err?.code === 'SLUG_EXISTS') return res.status(409).json({ error: 'Slug exists' });
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  }
  try {
    const [exists] = await db.execute('SELECT id FROM content WHERE slug=?', [slug]);
    if (exists.length) return res.status(409).json({ error: 'Slug exists' });
    const [result] = await db.execute('INSERT INTO content (title, slug, body, image_url, published) VALUES (?,?,?,?,?)', [title, slug, body || '', image_url || '', published ? 1 : 0]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.put('/:id', requireRole(['admin']), async (req, res) => {
  const id = req.params.id;
  const { title, slug, body, image_url, published } = req.body;
  if (DEV_BYPASS) {
    try {
      const result = updateContent(id, { title, slug, body, image_url, published });
      return res.json(result);
    } catch (err) {
      if (err?.code === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  }
  try {
    await db.execute('UPDATE content SET title=?, slug=?, body=?, image_url=?, published=? WHERE id=?', [title, slug, body || '', image_url || '', published ? 1 : 0, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.delete('/:id', requireRole(['admin']), async (req, res) => {
  const id = req.params.id;
  if (DEV_BYPASS) {
    try {
      const result = deleteContent(id);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: 'Server error', details: err.message });
    }
  }
  try {
    await db.execute('DELETE FROM content WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;