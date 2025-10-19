import { useEffect, useMemo, useRef, useState } from 'react';
import { MarketsAPI } from '../api/markets.js';
import Sparkline from './Sparkline.jsx';

const KNOWN_LARGE_CAPS = new Set([
  'ASELS','BIMAS','THYAO','KCHOL','ISCTR','EREGL','SAHOL','TUPRS','YKBNK','FROTO','TOASO','GARAN','AKBNK','HALKB','VAKBN','SASA','HEKTS','KONTR','ALARK','PETKM','BJKAS',
]);

function SectionTitle({ children }) { return <h3 className="text-base font-semibold mb-2">{children}</h3>; }

function formatNumber(n, digits = 2) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n/1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `${(n/1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${(n/1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${(n/1e3).toFixed(digits)}K`;
  return n.toFixed(digits);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LesserKnownStocks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState({});
  const selectedCodesRef = useRef([]);
  const timerRef = useRef(null);

  // Initial load: pick candidates and fetch details
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const listRes = await MarketsAPI.getBigparaList();
        const raw = Array.isArray(listRes?.data) ? listRes.data : Array.isArray(listRes) ? listRes : [];
        const codes = raw.map((x) => x?.kod || x?.code || x).filter((c) => typeof c === 'string');
        const filtered = codes.filter((c) => c && !c.startsWith('XU') && !KNOWN_LARGE_CAPS.has(c));
        const sample = shuffle(filtered).slice(0, 25);
        const results = await Promise.allSettled(sample.map((code) => MarketsAPI.getBigparaDetail(code)));
        const mapped = results.map((r, idx) => {
          if (r.status !== 'fulfilled') return null;
          const d = r.value?.data?.hisseYuzeysel || r.value?.hisseYuzeysel || r.value || {};
          const code = d.sembol || sample[idx];
          const name = d.aciklama || code;
          const last = (typeof d.kapanis === 'number' && d.kapanis) || (typeof d.satis === 'number' && d.satis) || (typeof d.alis === 'number' && d.alis) || null;
          const changePercent = typeof d.yuzdedegisim === 'number' ? d.yuzdedegisim : null;
          return {
            code,
            name,
            last,
            changePercent,
            high: d.yuksek,
            low: d.dusuk,
            close: d.kapanis,
            volumeLot: d.hacimlot,
            volumeTL: d.hacimtl,
            marketCap: d.piydeg,
            beta: d.beta,
            time: d.tarih,
          };
        }).filter(Boolean);
        // Choose 10 by smallest market cap (fallback: by name)
        const sorted = mapped.sort((a, b) => {
          const am = typeof a.marketCap === 'number' ? a.marketCap : Infinity;
          const bm = typeof b.marketCap === 'number' ? b.marketCap : Infinity;
          if (am === bm) return (a.name || a.code).localeCompare(b.name || b.code);
          return am - bm;
        });
        const top10 = sorted.slice(0, 10);
        selectedCodesRef.current = top10.map((x) => x.code);
        if (mounted) setItems(top10);
        if (mounted) setHistory((prev) => {
          const next = { ...prev };
          top10.forEach((x) => {
            const price = typeof x.last === 'number' ? x.last : null;
            const arr = Array.isArray(next[x.code]) ? next[x.code].slice() : [];
            if (typeof price === 'number') arr.push(price);
            next[x.code] = arr.slice(-60);
          });
          return next;
        });
        // Start polling every 30s
        if (!timerRef.current) {
          timerRef.current = setInterval(async () => {
            try {
              const codes = selectedCodesRef.current.slice();
              if (!codes.length) return;
              const updResults = await Promise.allSettled(codes.map((code) => MarketsAPI.getBigparaDetail(code)));
              const byCode = {};
              updResults.forEach((r, idx) => {
                if (r.status !== 'fulfilled') return;
                const d = r.value?.data?.hisseYuzeysel || r.value?.hisseYuzeysel || r.value || {};
                const code = d.sembol || codes[idx];
                const name = d.aciklama || code;
                const last = (typeof d.kapanis === 'number' && d.kapanis) || (typeof d.satis === 'number' && d.satis) || (typeof d.alis === 'number' && d.alis) || null;
                byCode[code] = {
                  code,
                  name,
                  last,
                  changePercent: typeof d.yuzdedegisim === 'number' ? d.yuzdedegisim : null,
                  high: d.yuksek,
                  low: d.dusuk,
                  close: d.kapanis,
                  volumeLot: d.hacimlot,
                  volumeTL: d.hacimtl,
                  marketCap: d.piydeg,
                  beta: d.beta,
                  time: d.tarih,
                };
              });
              setItems((prev) => prev.map((x) => byCode[x.code] ? byCode[x.code] : x));
              setHistory((prev) => {
                const next = { ...prev };
                Object.values(byCode).forEach((x) => {
                  const price = typeof x.last === 'number' ? x.last : null;
                  const arr = Array.isArray(next[x.code]) ? next[x.code].slice() : [];
                  if (typeof price === 'number') arr.push(price);
                  next[x.code] = arr.slice(-120);
                });
                return next;
              });
            } catch (_) { /* ignore */ }
          }, 30000);
        }
      } catch (e) {
        if (mounted) setError('Veri yüklenemedi');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const cards = useMemo(() => Array.isArray(items) ? items : [], [items]);

  const analyze = (code, item) => {
    const arr = Array.isArray(history[code]) ? history[code] : [];
    const n = arr.length;
    const last = typeof item?.last === 'number' ? item.last : (n ? arr[n - 1] : null);
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
    const rangePos = (typeof item?.low === 'number' && typeof item?.high === 'number' && last) ? ((last - item.low) / Math.max(0.001, (item.high - item.low))) : null;
    const rangeLabel = (() => {
      if (rangePos == null) return '—';
      if (rangePos < 0.33) return 'Gün içi alt bölgede';
      if (rangePos < 0.66) return 'Gün içi orta bölgede';
      return 'Gün içi üst bölgede';
    })();
    const momentumLabel = (ma5 && last) ? (last >= ma5 ? 'Kısa vadeli momentum pozitif' : 'Kısa vadeli momentum negatif') : '—';
    const trendLabel = (ma20 && last) ? (last >= ma20 ? 'Orta vadeli trend yukarı' : 'Orta vadeli trend aşağı') : '—';
    return { last, ma5, ma20, volPct, volLabel, rangeLabel, momentumLabel, trendLabel };
  };

  return (
    <div className="space-y-3">
      <SectionTitle>Az Bilinen Hisseler (10)</SectionTitle>
      {loading && (<div className="text-sm text-gray-500">Yükleniyor…</div>)}
      {error && (<div className="text-sm text-red-600">{error}</div>)}
      {!loading && !error && (
        <div className="grid md:grid-cols-2 gap-3">
          {cards.map((it) => {
            const a = analyze(it.code, it);
            const hist = Array.isArray(history[it.code]) ? history[it.code] : [];
            const changeCls = ((it.changePercent || 0) >= 0) ? 'text-green-600' : 'text-red-600';
            return (
              <div key={it.code} className="rounded-xl border bg-white shadow-sm">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{it.name || it.code}</div>
                    <div className="text-xs text-gray-500">{it.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{typeof it.last === 'number' ? it.last.toFixed(2) : '—'}</div>
                    <div className={`text-xs ${changeCls}`}>{typeof it.changePercent === 'number' ? `${it.changePercent > 0 ? '+' : ''}${it.changePercent.toFixed(2)}%` : '—'}</div>
                  </div>
                </div>
                <div className="px-3">
                  <Sparkline data={hist.length ? hist : [it.last || 0]} height={100} />
                </div>
                <div className="p-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="opacity-70">En yüksek</div><div className="text-right">{formatNumber(it.high)}</div>
                  <div className="opacity-70">En düşük</div><div className="text-right">{formatNumber(it.low)}</div>
                  <div className="opacity-70">Hacim (TL)</div><div className="text-right">{formatNumber(it.volumeTL, 0)}</div>
                  <div className="opacity-70">Piyasa değeri</div><div className="text-right">{formatNumber(it.marketCap, 0)}</div>
                </div>
                <div className="p-3 border-t text-xs text-gray-700 space-y-1">
                  <div>• {a.momentumLabel}</div>
                  <div>• {a.trendLabel}</div>
                  <div>• {a.volLabel}{a.volPct != null ? ` (${a.volPct.toFixed(2)}%)` : ''}</div>
                  <div>• {a.rangeLabel}</div>
                </div>
              </div>
            );
          })}
          {!cards.length ? (<div className="p-3 text-sm text-gray-500">Uygun hisse bulunamadı</div>) : null}
        </div>
      )}
      <div className="text-xs text-gray-400">Güncelleme aralığı ~30sn.</div>
    </div>
  );
}