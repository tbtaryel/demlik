import express from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { listPages, getPageBySlug, addPage, updatePage, deletePage } from '../config/devPages.js';
const router = express.Router();

const DEV_BYPASS = String(process.env.AUTH_DEV_BYPASS || '').toLowerCase() === 'true';

// List all pages
router.get('/', requireAuth, async (req, res) => {
  if (DEV_BYPASS) {
    return res.json(listPages());
  }
  try {
    const [rows] = await db.query('SELECT id, title, slug, body, published, created_at, updated_at FROM pages ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

// Get page by slug
router.get('/:slug', requireAuth, async (req, res) => {
  if (DEV_BYPASS) {
    const p = getPageBySlug(req.params.slug);
    if (!p) return res.status(404).json({ error: 'Page not found' });
    return res.json(p);
  }
  try {
    const [rows] = await db.query('SELECT id, title, slug, body, published FROM pages WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Page not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get page' });
  }
});

// Create page (admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, slug, body, published = 0 } = req.body || {};
  if (DEV_BYPASS) {
    try {
      const created = addPage({ title, slug, body, published });
      return res.json(created);
    } catch (err) {
      const msg = err.message === 'slug_exists' ? 'Slug exists' : (err.message || 'Failed to create page');
      return res.status(400).json({ error: msg });
    }
  }
  if (!title || !slug) return res.status(400).json({ error: 'title and slug are required' });
  try {
    await db.query('INSERT INTO pages (title, slug, body, published) VALUES (?, ?, ?, ?)', [title, slug, body || '', published ? 1 : 0]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Update page (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, slug, body, published } = req.body || {};
  if (DEV_BYPASS) {
    try {
      const result = updatePage(req.params.id, { title, slug, body, published });
      return res.json(result);
    } catch (err) {
      const msg = err.message === 'slug_exists' ? 'Slug exists' : (err.message || 'Failed to update page');
      return res.status(400).json({ error: msg });
    }
  }
  if (!title || !slug) return res.status(400).json({ error: 'title and slug are required' });
  try {
    await db.query('UPDATE pages SET title=?, slug=?, body=?, published=? WHERE id=?', [title, slug, body || '', published ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// Delete page (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  if (DEV_BYPASS) {
    try {
      const result = deletePage(req.params.id);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Failed to delete page' });
    }
  }
  try {
    await db.query('DELETE FROM pages WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

export default router;