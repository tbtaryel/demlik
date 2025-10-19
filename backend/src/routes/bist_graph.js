import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

const DATA_FILE = path.resolve('uploads', 'bist_graph.json');
const METRICS_FILE = path.resolve('uploads', 'bist_graph_meta.json');
const INTRADAY_FILE = path.resolve('uploads', 'bist_graph_intraday.json');

function ensureFile(filePath, defaultContent) {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, defaultContent, 'utf8');
    }
  } catch (err) {
    console.error('Failed to ensure file:', filePath, err);
  }
}

ensureFile(DATA_FILE, '[]');
ensureFile(METRICS_FILE, '{}');
ensureFile(INTRADAY_FILE, '{}');

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || 'null');
  } catch (err) {
    console.error('Failed to read JSON:', filePath, err);
    return null;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to write JSON:', filePath, err);
    return false;
  }
}

// GET /api/bist-graph/data
router.get('/data', (req, res) => {
  const arr = readJson(DATA_FILE);
  if (!arr || !Array.isArray(arr)) {
    return res.status(200).json([]);
  }
  return res.json(arr);
});

// POST /api/bist-graph/add
router.post('/add', requireAuth, requireRole(['admin']), (req, res) => {
  const { date, value } = req.body || {};

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date is required as string (YYYY-MM-DD)' });
  }
  const numVal = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numVal)) {
    return res.status(400).json({ error: 'value must be a valid number' });
  }

  const arr = readJson(DATA_FILE) || [];
  const next = [...arr, { date, value: numVal }];
  const ok = writeJson(DATA_FILE, next);
  if (!ok) {
    return res.status(500).json({ error: 'Failed to persist data' });
  }
  return res.json({ success: true, count: next.length });
});

// GET /api/bist-graph/metrics
router.get('/metrics', (req, res) => {
  const metrics = readJson(METRICS_FILE);
  if (!metrics || typeof metrics !== 'object') {
    return res.status(200).json({});
  }
  return res.json(metrics);
});

// PUT /api/bist-graph/metrics
router.put('/metrics', requireAuth, requireRole(['admin']), (req, res) => {
  const { high, low, prev_close } = req.body || {};

  const current = readJson(METRICS_FILE) || {};
  const next = { ...current };

  function coerceNum(n) {
    if (typeof n === 'number') return n;
    const v = Number(n);
    return Number.isFinite(v) ? v : undefined;
  }

  const newHigh = coerceNum(high);
  const newLow = coerceNum(low);
  const newPrev = coerceNum(prev_close);

  if (newHigh !== undefined) next.high = newHigh;
  if (newLow !== undefined) next.low = newLow;
  if (newPrev !== undefined) next.prev_close = newPrev;

  const ok = writeJson(METRICS_FILE, next);
  if (!ok) {
    return res.status(500).json({ error: 'Failed to persist metrics' });
  }
  return res.json({ success: true, metrics: next });
});

// GET /api/bist-graph/intraday
router.get('/intraday', (req, res) => {
  const obj = readJson(INTRADAY_FILE) || {};
  const qDate = String(req.query.date || '').trim();
  let targetDate = qDate || null;
  if (!targetDate) {
    const dates = Object.keys(obj).sort((a, b) => String(b).localeCompare(String(a)));
    targetDate = dates[0] || null;
  }
  if (!targetDate) {
    return res.json({ date: null, series: {} });
  }
  const series = (obj && typeof obj[targetDate] === 'object') ? obj[targetDate] : {};
  const out = {};
  INTRADAY_TIMES.forEach((t) => {
    const v = series?.[t];
    if (typeof v === 'number') out[t] = v;
    else if (v != null) {
      const n = Number(v);
      if (Number.isFinite(n)) out[t] = n;
    }
  });
  return res.json({ date: targetDate, series: out });
});

// PUT /api/bist-graph/intraday
router.put('/intraday', requireAuth, requireRole(['admin']), (req, res) => {
  const { date, series } = req.body || {};
  const d = String(date || '').trim();
  if (!d) {
    return res.status(400).json({ error: 'date is required as string (YYYY-MM-DD)' });
  }
  const obj = readJson(INTRADAY_FILE) || {};
  const nextSeries = {};
  INTRADAY_TIMES.forEach((t) => {
    const v = series?.[t];
    if (v != null) {
      const n = (typeof v === 'number') ? v : Number(v);
      if (Number.isFinite(n)) nextSeries[t] = n;
    }
  });
  obj[d] = nextSeries;
  const ok = writeJson(INTRADAY_FILE, obj);
  if (!ok) {
    return res.status(500).json({ error: 'Failed to persist intraday series' });
  }
  return res.json({ success: true, date: d, series: nextSeries });
});

const INTRADAY_TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
export default router;