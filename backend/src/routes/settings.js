import { Router } from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { getDevSettings, setDevSettings } from '../config/devSettings.js';

const router = Router();
const DEV_BYPASS = String(process.env.AUTH_DEV_BYPASS || '').toLowerCase() === 'true';

// Public: read settings (used on landing and public pages)
router.get('/', async (req, res) => {
  if (DEV_BYPASS) {
    // Return in-memory settings when dev bypass is enabled
    return res.json(getDevSettings());
  }
  try {
    const [rows] = await db.execute('SELECT `key`, `value` FROM settings');
    const out = {};
    rows.forEach((r) => (out[r.key] = r.value));
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Protected: write settings (admin only)
router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  const settings = req.body || {};
  if (DEV_BYPASS) {
    // Update in-memory settings and return success in dev bypass mode
    setDevSettings(settings);
    return res.json({ ok: true, dev_bypass: true });
  }
  try {
    const keys = Object.keys(settings);
    for (const k of keys) {
      const v = String(settings[k]);
      await db.execute(
        'INSERT INTO settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)',
        [k, v]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;