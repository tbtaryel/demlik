import express from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
const router = express.Router();

// List menus
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, code FROM menus ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list menus' });
  }
});

// Create menu (admin)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, code } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
  try {
    await db.query('INSERT INTO menus (name, code) VALUES (?, ?)', [name, code]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

// Update menu (admin)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, code } = req.body || {};
  if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
  try {
    await db.query('UPDATE menus SET name=?, code=? WHERE id=?', [name, code, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

// Delete menu (admin)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM menus WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

// List items of a menu
router.get('/:id/items', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, menu_id, label, url, sort_order FROM menu_items WHERE menu_id=? ORDER BY sort_order ASC, id ASC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list menu items' });
  }
});

// Create menu item (admin)
router.post('/:id/items', requireAuth, requireRole('admin'), async (req, res) => {
  const { label, url, sort_order = 0 } = req.body || {};
  if (!label || !url) return res.status(400).json({ error: 'label and url are required' });
  try {
    await db.query('INSERT INTO menu_items (menu_id, label, url, sort_order) VALUES (?, ?, ?, ?)', [req.params.id, label, url, Number(sort_order) || 0]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// Update menu item (admin)
router.put('/items/:itemId', requireAuth, requireRole('admin'), async (req, res) => {
  const { label, url, sort_order = 0 } = req.body || {};
  if (!label || !url) return res.status(400).json({ error: 'label and url are required' });
  try {
    await db.query('UPDATE menu_items SET label=?, url=?, sort_order=? WHERE id=?', [label, url, Number(sort_order) || 0, req.params.itemId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item (admin)
router.delete('/items/:itemId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM menu_items WHERE id=?', [req.params.itemId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;