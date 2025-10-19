import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { MarketsAPI } from '../api/markets.js';
import BistChart from '../components/BistChart.jsx';
import RecommendedStocks from '../components/RecommendedStocks.jsx';
import { connectDxFeed, subscribeQuotes } from '../lib/dxfeed.js';
import ContentBlock from '../components/ContentBlock.jsx';

function SectionTitle({ children }) { return <h2 className="text-lg font-semibold mb-2">{children}</h2>; }

function QuickActions() {
  const actions = [
    { label: 'Gün içi işlem', to: '/intraday' },
    { label: 'Halka arz başvurusu', to: '/ipo' },
    { label: 'Blok işlemi', to: '/block-trade' },
    { label: 'Büyüme Hisseleri', to: '/growth-stocks' },
    { label: 'Kantitatif takip', to: '/quantitative' },
  ];
  return (
    <div className="grid grid-cols-5 gap-2 text-xs mt-3">
      {actions.map((a) => (
        <Link key={a.label} to={a.to} className="flex flex-col items-center justify-center p-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">
          <span>{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default function Market() {
  const [selectedIndex] = useState('XU100');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [midas, setMidas] = useState([]);
  const [indexSeries, setIndexSeries] = useState({});
  const [adminCfg, setAdminCfg] = useState(null);
  // dxFeed state
  const [dxReady, setDxReady] = useState(false);
  const [dxMap, setDxMap] = useState({}); // symbol => { last, open, high, changePercent, time }
  const [dxSeries, setDxSeries] = useState({}); // symbol => [last]
  const dxBulkSubRef = useRef(null);
  const [settings, setSettings] = useState({ app_name: 'Dia', country_label: 'Türkiye' });
  const [metrics, setMetrics] = useState({});
  const [intradayDate, setIntradayDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let mounted = true;
    api.get('/bist-graph/metrics').then((r) => {
      if (!mounted) return;
      const m = r.data || {};
      setMetrics(m);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      try {
        // Load settings
        api.get('/settings').then((r) => {
          if (!mounted) return;
          const s = r.data || {};
          setSettings({ app_name: s.app_name || 'Dia', country_label: s.country_label || 'Türkiye' });
        }).catch(() => {});
        // Load admin override config (XU100)
        try {
          const cfg = await MarketsAPI.getMarketIndexConfig('XU100');
          if (mounted) setAdminCfg(cfg || null);
        } catch (_) { /* ignore */ }
        const d = await MarketsAPI.getBistIndexDetail('XU100');
        if (mounted) setDetail(d);

        // Load Midas table data in parallel
        try {
          const midasRaw = await MarketsAPI.getMidasTableData();
          const arr = typeof midasRaw === 'string' ? JSON.parse(midasRaw) : Array.isArray(midasRaw) ? midasRaw : (Array.isArray(midasRaw?.data) ? midasRaw.data : []);
          if (mounted) setMidas(arr);
        } catch (_) { /* ignore */ }
      } catch (e) {
        setError('Veri yüklenemedi');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Endeksler için gerçek zamanlıya yakın seri: Midas tablo verisini periyodik çek ve serilere ekle
  useEffect(() => {
    let mounted = true;
    let timer = null;
    const fetchMidas = async () => {
      try {
        const midasRaw = await MarketsAPI.getMidasTableData();
        const arr = typeof midasRaw === 'string' ? JSON.parse(midasRaw) : Array.isArray(midasRaw) ? midasRaw : (Array.isArray(midasRaw?.data) ? midasRaw.data : []);
        if (!mounted) return;
        setMidas(arr);
        // Sadece XU100 serisini güncelle
        setIndexSeries((prev) => {
          const next = { ...prev };
          const entry = Array.isArray(arr) ? arr.find((x) => x.Code === 'XU100') : null;
          const last = typeof entry?.Last === 'number' ? entry.Last : null;
          if (typeof last === 'number') {
            const prevArr = Array.isArray(next['XU100']) ? next['XU100'] : [];
            next['XU100'] = [...prevArr, last].slice(-240);
          }
          return next;
        });
      } catch (_) { /* ignore */ }
    };
    // initial and interval
    fetchMidas();
    timer = setInterval(fetchMidas, 10000);
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, []);

  // XU100 odaklı olduğumuz için endeks listesi/fallback gerekmiyor

  // dxFeed bağlantısı (demo URL veya env değişkenlerinden)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await connectDxFeed({
        url: import.meta.env.VITE_DXFEED_URL,
        username: import.meta.env.VITE_DXFEED_USERNAME,
        password: import.meta.env.VITE_DXFEED_PASSWORD,
      });
      if (mounted) setDxReady(ok);
    })().catch(() => setDxReady(false));
    return () => { mounted = false; };
  }, []);

  // dxFeed: yalnız XU100 aboneliği
  useEffect(() => {
    if (!dxReady) return;
    try { dxBulkSubRef.current?.cancel?.(); } catch (_) {}
    dxBulkSubRef.current = subscribeQuotes(['XU100'], (events) => {
      // events: array of quote updates
      setDxMap((prev) => {
        const next = { ...prev };
        events.forEach((ev) => {
          const sym = ev?.eventSymbol || ev?.symbol || ev?.Symbol || 'XU100';
          if (!sym) return;
          const last = (ev?.last ?? ev?.Last ?? ev?.lastPrice ?? ev?.price ?? null);
          const open = (ev?.open ?? ev?.Open ?? null);
          const high = (ev?.high ?? ev?.High ?? null);
          const changePercent = (ev?.changePercent ?? ev?.ChangePercent ?? ev?.change ?? null);
          const time = (ev?.time ?? ev?.Time ?? Date.now());
          next[sym] = { last, open, high, changePercent, time };
        });
        return next;
      });
      setDxSeries((prev) => {
        const next = { ...prev };
        events.forEach((ev) => {
          const sym = ev?.eventSymbol || ev?.symbol || ev?.Symbol || 'XU100';
          const last = (ev?.last ?? ev?.Last ?? ev?.lastPrice ?? ev?.price ?? null);
          if (!sym || typeof last !== 'number') return;
          const arr = Array.isArray(next[sym]) ? next[sym] : [];
          next[sym] = [...arr, last].slice(-240);
        });
        return next;
      });
    }, (err) => {
      console.warn('dxFeed subscription error:', err);
    });
    return () => {
      try { dxBulkSubRef.current?.cancel?.(); } catch (_) {}
      dxBulkSubRef.current = null;
    };
  }, [dxReady]);

  useEffect(() => {
    if (!selectedIndex) return;
    let mounted = true;
    async function loadDetail() {
      setError('');
      try {
        const d = await MarketsAPI.getBistIndexDetail(selectedIndex);
        if (mounted) setDetail(d);
      } catch (e) {
        // noop
      }
    }
    loadDetail();
    return () => { mounted = false; };
  }, [selectedIndex]);

  const series = useMemo(() => {
    // Admin override: Seri varsa ve enabled ise en üstte kullan
    try {
      const enabled = !!adminCfg?.enabled;
      const arrAdmin = (() => {
        if (!enabled) return null;
        const raw = adminCfg?.series_json;
        if (!raw) return null;
        const arr = JSON.parse(String(raw));
        return Array.isArray(arr) ? arr.filter((n) => typeof n === 'number') : null;
      })();
      if (Array.isArray(arrAdmin) && arrAdmin.length >= 3) return arrAdmin;
    } catch (_) {}
    // Sadece XU100: dxFeed serisi varsa kullan, yoksa Midas/Foreks
    const sdx = dxSeries?.['XU100'];
    if (Array.isArray(sdx) && sdx.length >= 3) return sdx;
    const s = indexSeries?.['XU100'];
    if (Array.isArray(s) && s.length >= 3) return s;
    const d = detail || {};
    const candidates = [d?.graphData, d?.series, d?.data].find((x) => Array.isArray(x) && x.length);
    if (Array.isArray(candidates)) {
      const arr = candidates.map((p) => typeof p === 'number' ? p : (p?.value || p?.price || p?.close || 0)).filter((n) => typeof n === 'number');
      if (arr.length >= 2) return arr;
    }
    // Fallback: smooth mock series when nothing available yet
    const arr = Array.from({ length: 40 }, (_, i) => 10400 + Math.sin(i / 4) * 60 + Math.random() * 25);
    return arr;
  }, [detail, indexSeries, dxSeries]);

  const selectedEntry = useMemo(() => {
    return Array.isArray(midas) ? midas.find((x) => x.Code === 'XU100') : null;
  }, [midas]);

  const highVal = useMemo(() => {
    // Admin override first
    if (typeof metrics.high === 'number') return metrics.high;
    if (adminCfg && adminCfg.enabled && typeof adminCfg.high === 'number') return adminCfg.high;
    const dx = dxMap[selectedIndex] || {};
    if (typeof dx.high === 'number') return dx.high;
    const d = detail || {};
    const v = (typeof selectedEntry?.High === 'number' ? selectedEntry.High : (typeof d.High === 'number' ? d.High : null));
    if (typeof v === 'number') return v;
    const arr = Array.isArray(series) ? series : [];
    return arr.length ? Math.max(...arr) : null;
  }, [selectedEntry, detail, dxMap, series, adminCfg, metrics]);
  const lowVal = useMemo(() => {
    if (typeof metrics.low === 'number') return metrics.low;
    if (adminCfg && adminCfg.enabled && typeof adminCfg.low === 'number') return adminCfg.low;
    const d = detail || {};
    const v = (typeof selectedEntry?.Low === 'number' ? selectedEntry.Low : (typeof d.Low === 'number' ? d.Low : null));
    if (typeof v === 'number') return v;
    const arr = Array.isArray(series) ? series : [];
    return arr.length ? Math.min(...arr) : null;
  }, [selectedEntry, detail, series, adminCfg, metrics]);
  const closeVal = useMemo(() => {
    const dx = dxMap[selectedIndex] || {};
    if (typeof dx.last === 'number') return dx.last;
    const d = detail || {};
    const c = (typeof selectedEntry?.Close === 'number' ? selectedEntry.Close : (typeof selectedEntry?.Last === 'number' ? selectedEntry.Last : null));
    if (typeof c === 'number') return c;
    return (typeof d.Close === 'number' ? d.Close : (typeof d.Last === 'number' ? d.Last : null));
  }, [selectedEntry, detail, dxMap]);

  const prevCloseVal = useMemo(() => {
    if (typeof metrics.prev_close === 'number') return metrics.prev_close;
    if (adminCfg && adminCfg.enabled && typeof adminCfg.prev_close === 'number') return adminCfg.prev_close;
    const d = detail || {};
    const dx = dxMap['XU100'] || {};
    if (typeof d.PreviousClose === 'number') return d.PreviousClose;
    if (typeof d.PrevClose === 'number') return d.PrevClose;
    if (typeof selectedEntry?.PreviousClose === 'number') return selectedEntry.PreviousClose;
    if (typeof selectedEntry?.PrevClose === 'number') return selectedEntry.PrevClose;
    const last = (typeof dx.last === 'number') ? dx.last : (typeof closeVal === 'number' ? closeVal : (typeof selectedEntry?.Last === 'number' ? selectedEntry.Last : null));
    const pct = (typeof dx.changePercent === 'number') ? dx.changePercent : (typeof selectedEntry?.DailyChangePercent === 'number' ? selectedEntry.DailyChangePercent : null);
    if (typeof last === 'number' && typeof pct === 'number') {
      const prev = last / (1 + (pct / 100));
      return prev;
    }
    const arr = Array.isArray(series) ? series : [];
    return arr.length >= 2 ? arr[arr.length - 2] : (arr.length ? arr[0] : null);
  }, [detail, dxMap, selectedEntry, closeVal, series, adminCfg, metrics]);

  const formatTr = (n) => (typeof n === 'number' ? n.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '—');

  const idxAnalysis = useMemo(() => {
    const arr = Array.isArray(indexSeries?.[selectedIndex]) ? indexSeries[selectedIndex] : [];
    const n = arr.length;
    const last = typeof arr[n - 1] === 'number' ? arr[n - 1] : null;
    const ma5 = n >= 5 ? arr.slice(n - 5).reduce((a, b) => a + b, 0) / 5 : null;
    const ma20 = n >= 20 ? arr.slice(n - 20).reduce((a, b) => a + b, 0) / 20 : null;
    const volStd = (() => {
      if (n < 10) return null;
      const sample = arr.slice(-20);
      const mean = sample.reduce((a, b) => a + b, 0) / sample.length;
      const variance = sample.reduce((a, b) => a + (b - mean) * (b - mean), 0) / sample.length;
      return Math.sqrt(variance);
    })();
    const volPct = (volStd && last) ? (volStd / last) * 100 : null;
    const volLabel = (() => {
      if (volPct == null) return '—';
      if (volPct < 0.3) return 'Düşük volatilite';
      if (volPct < 0.8) return 'Orta volatilite';
      return 'Yüksek volatilite';
    })();
    const rangePos = (typeof lowVal === 'number' && typeof highVal === 'number' && typeof last === 'number')
      ? ((last - lowVal) / Math.max(0.001, (highVal - lowVal)))
      : null;
    const rangeLabel = (() => {
      if (rangePos == null) return '—';
      if (rangePos < 0.33) return 'Gün içi alt bölgede';
      if (rangePos < 0.66) return 'Gün içi orta bölgede';
      return 'Gün içi üst bölgede';
    })();
    const momentumLabel = (ma5 && last) ? (last >= ma5 ? 'Kısa vadeli momentum pozitif' : 'Kısa vadeli momentum negatif') : '—';
    const trendLabel = (ma20 && last) ? (last >= ma20 ? 'Orta vadeli trend yukarı' : 'Orta vadeli trend aşağı') : '—';
    return { last, ma5, ma20, volPct, volLabel, rangeLabel, momentumLabel, trendLabel };
  }, [indexSeries, selectedIndex, highVal, lowVal]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{settings.app_name || 'Dia'}</h1>
        <div className="text-gray-500">{settings.country_label || 'Türkiye'}</div>
      </header>
      <ContentBlock slug="market" className="mb-4" />

      <div className="p-4 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <div className="flex items-end gap-3">
          <div className="text-2xl font-bold">XU100</div>
          {(() => {
            const dx = dxMap['XU100'] || {};
            const pct = (typeof dx.changePercent === 'number') ? dx.changePercent : selectedEntry?.DailyChangePercent;
            const cls = ((pct || 0) >= 0) ? 'text-green-600' : 'text-red-600';
            const txt = (pct != null) ? `${pct > 0 ? '+' : ''}${Number(pct).toFixed(2)}%` : '—';
            return <div className={`text-sm ${cls}`}>{txt}</div>;
          })()}
        </div>
        {/* Üstteki kısa metrik satırı kaldırıldı; detaylar grafiğin altındaki tabloda gösteriliyor */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm text-gray-600">Tarih</label>
            <input type="date" className="border rounded px-2 py-1 text-sm" value={intradayDate} onChange={(e) => setIntradayDate(e.target.value)} />
          </div>
          <BistChart height={220} date={intradayDate} />
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-2 text-gray-600">Gün İçi En Yüksek</td>
                <td className="p-2 text-right font-medium">{formatTr(highVal)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 text-gray-600">Gün İçi En Düşük</td>
                <td className="p-2 text-right font-medium">{formatTr(lowVal)}</td>
              </tr>
              <tr>
                <td className="p-2 text-gray-600">Önceki Kapanış</td>
                <td className="p-2 text-right font-medium">{formatTr(prevCloseVal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-gray-700 space-y-1">
          <div>• {idxAnalysis.momentumLabel}</div>
          <div>• {idxAnalysis.trendLabel}</div>
          <div>• {idxAnalysis.volLabel}{idxAnalysis.volPct != null ? ` (${idxAnalysis.volPct.toFixed(2)}%)` : ''}</div>
          <div>• {idxAnalysis.rangeLabel}</div>
        </div>
        <QuickActions />
      </div>

      {/* Endeksler bölümü kaldırıldı: yalnız XU100 gösteriliyor */}

      <div>
        <RecommendedStocks />
      </div>
  </div>
);
}