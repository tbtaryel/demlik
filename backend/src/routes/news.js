import { Router } from 'express';
import { XMLParser } from 'fast-xml-parser';
import { db } from '../config/db.js';
import { getDevSettings } from '../config/devSettings.js';

const router = Router();

// simple in-memory caches
const cache = {
  trtJson: { ts: 0, data: [] },
};
const settingsCache = { ts: 0, data: {} };

const DEV_BYPASS = String(process.env.AUTH_DEV_BYPASS || '').toLowerCase() === 'true';

async function loadSettings() {
  try {
    if (DEV_BYPASS) {
      // Use in-memory settings when dev bypass is enabled
      return getDevSettings();
    }
    const now = Date.now();
    if (now - settingsCache.ts < 60_000 && settingsCache.data && Object.keys(settingsCache.data).length) {
      return settingsCache.data;
    }
    const [rows] = await db.execute('SELECT `key`, `value` FROM settings');
    const out = {};
    rows.forEach((r) => { out[r.key] = r.value; });
    settingsCache.ts = now;
    settingsCache.data = out;
    return out;
  } catch (_) {
    return {};
  }
}

async function proxyXml(res, url) {
  try {
    const r = await fetch(url, { headers: { accept: 'application/xml,text/xml,*/*' } });
    const contentType = r.headers.get('content-type') || 'application/xml';
    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).send(text);
    }
    res.type(contentType.includes('xml') ? contentType : 'application/xml');
    return res.send(text);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy failure', details: err.message });
  }
}

// TRT Haber: Son Dakika (raw XML proxy)
router.get('/trt-sondakika', async (req, res) => {
  const url = 'http://www.trthaber.com/xml_mobile.php?tur=xml_genel&kategori=sondakika&adet=20&selectEx=yorumSay,okunmaadedi,anasayfamanset,kategorimanset';
  return proxyXml(res, url);
});

// Generic RSS/Atom loader + TRT fallback (JSON, cached, configurable)
router.get('/trt-sondakika.json', async (req, res) => {
  try {
    const s = await loadSettings();
    const ttlSec = Math.max(30, Number(s.news_cache_ttl_sec) || 120);
    const maxItems = Math.max(1, Number(s.news_max_items) || 10);
    const now = Date.now();
    if (now - cache.trtJson.ts < ttlSec * 1000 && Array.isArray(cache.trtJson.data) && cache.trtJson.data.length) {
      return res.json(cache.trtJson.data.slice(0, maxItems));
    }

    // Resolve sources from settings
    let sources = [];
    try {
      if (s.news_feed_urls) {
        const arr = JSON.parse(s.news_feed_urls);
        if (Array.isArray(arr)) sources = arr.filter((u) => typeof u === 'string' && u.trim());
      }
    } catch (_) { /* ignore */ }
    const singleUrl = (s.news_rss_url || '').trim();
    if (!sources.length) {
      if (singleUrl) sources = [singleUrl];
      else sources = ['http://www.trthaber.com/xml_mobile.php?tur=xml_genel&kategori=sondakika&adet=20&selectEx=yorumSay,okunmaadedi,anasayfamanset,kategorimanset'];
    }

    // Category whitelist
    let allowedSet = new Set(['ekonomi', 'gundem', 'siyaset', 'politika']);
    try {
      if (s.news_category_whitelist) {
        const arr = JSON.parse(s.news_category_whitelist);
        if (Array.isArray(arr) && arr.length) {
          allowedSet = new Set(arr.map((x) => String(x || '').toLowerCase()));
        }
      }
    } catch (_) { /* ignore */ }

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

    let allItems = [];
    for (const url of sources) {
      try {
        const r = await fetch(url, { headers: { accept: 'application/xml,text/xml,*/*' } });
        const xml = await r.text();
        if (!r.ok) continue; // skip failed source
        const doc = parser.parse(xml);

        // Normalize nodes
        let nodes = [];
        if (Array.isArray(doc?.rss?.channel?.item)) nodes = doc.rss.channel.item;
        else if (Array.isArray(doc?.items)) nodes = doc.items;
        else if (Array.isArray(doc?.haberler?.haber)) nodes = doc.haberler.haber;
        else if (Array.isArray(doc?.haber)) nodes = doc.haber;

        const items = (nodes || []).map((n, idx) => {
          const rawTitle = (n.title ?? n.baslik ?? n.Baslik ?? n.headline ?? n.icerikbasligi ?? n.spot ?? n.haber_manset ?? '')
            .toString()
            .trim();
          const rawBody = (n.description ?? n.ozet ?? n.spot ?? n.icerik ?? n.haber_aciklama ?? '')
            .toString()
            .trim();
          const title = rawTitle || (rawBody ? rawBody.replace(/\s+/g, ' ').slice(0, 120) : '');
          const image_url = (n.enclosure?.url ?? n.resim ?? n.image ?? n.gorsel ?? n.haber_resim ?? '')
            .toString();
          const created_at = (n.pubDate ?? n.tarih ?? n.date ?? null);
          let link = (n.link ?? n.url ?? n.haber_link ?? '').toString();
          if (link && !/^https?:\/\//i.test(link)) {
            // Try TRT-style prefix; for other feeds, keep as-is
            link = `https://www.trthaber.com/${link.replace(/^\/?/, '')}`;
          }
          const id = Number(n.haber_id ?? idx);
          let category = '';
          try {
            const m = link.match(/\/haber\/([^/]+)/i);
            category = (m?.[1] || '').toLowerCase();
          } catch (_) { /* ignore */ }
          return { id, title, body: rawBody, image_url, created_at, link, category };
        }).filter((x) => (x.title && x.title.toLowerCase() !== 'son dakika') || x.body);

        allItems = allItems.concat(items);
      } catch (_) {
        // skip source errors
      }
    }

    // De-duplicate by link+title
    const seen = new Set();
    const deduped = [];
    for (const it of allItems) {
      const key = (it.link || '') + '|' + (it.title || '').trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(it);
    }

    // Filter by category (if extracted), otherwise keep
    const filtered = deduped.filter((x) => !x.category || allowedSet.has(x.category));

    // Sort by created_at desc
    const sorted = filtered
      .map((x) => {
        let ts = 0;
        try { ts = Date.parse(x.created_at) || 0; } catch (_) {}
        return { ...x, _ts: ts };
      })
      .sort((a, b) => b._ts - a._ts);

    const topN = sorted.slice(0, maxItems);
    cache.trtJson = { ts: now, data: topN };
    return res.json(topN);
  } catch (err) {
    return res.status(500).json({ error: 'Parse failure', details: err.message });
  }
});

export default router;