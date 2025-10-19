import { useEffect, useMemo, useRef, useState } from 'react';
import { MarketsAPI } from '../api/markets.js';
import Sparkline from './Sparkline.jsx';

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

function normalize(values, v) {
  const arr = values.filter((x) => typeof x === 'number' && isFinite(x));
  if (!arr.length || typeof v !== 'number' || !isFinite(v)) return 0;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return 0.5;
  return (v - min) / (max - min);
}

export default function RecommendedStocks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState({});
  const [modal, setModal] = useState({ open: false, item: null });
  const selectedCodesRef = useRef([]);
  const timerRef = useRef(null);

  // Initial load: try admin-managed list first; fallback to Bigpara if empty
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      try {
        // Try admin-managed list
        try {
          const adminList = await MarketsAPI.getRecommendedPublic();
          const arr = Array.isArray(adminList) ? adminList : [];
          if (arr.length) {
            if (mounted) setItems(arr.map((x) => ({
              id: x.id, code: x.code, name: x.name, last: x.last, changePercent: x.change_percent,
              high: undefined, low: undefined, close: undefined, volumeTL: undefined, marketCap: undefined, beta: undefined, time: undefined,
            })));
            if (mounted) setHistory((prev) => {
              const next = { ...prev };
              arr.forEach((x) => {
                try {
                  const s = x.series_json ? JSON.parse(x.series_json) : [];
                  next[x.code] = Array.isArray(s) ? s.filter((n) => typeof n === 'number') : [];
                } catch (_) {
                  next[x.code] = [];
                }
              });
              return next;
            });
            selectedCodesRef.current = arr.map((x) => x.code);
            return; // done, skip Bigpara fallback
          }
        } catch (_) { /* ignore */ }

        const listRes = await MarketsAPI.getBigparaList();
        const raw = Array.isArray(listRes?.data) ? listRes.data : Array.isArray(listRes) ? listRes : [];
        const codes = raw.map((x) => x?.kod || x?.code || x).filter((c) => typeof c === 'string');
        const filtered = codes.filter((c) => c && !c.startsWith('XU'));
        const sample = filtered.slice(0, 250).sort(() => Math.random() - 0.5).slice(0, 50);
        const results = await Promise.allSettled(sample.map((code) => MarketsAPI.getBigparaDetail(code)));
        const mapped = results.map((r, idx) => {
          if (r.status !== 'fulfilled') return null;
          const d = r.value?.data?.hisseYuzeysel || r.value?.hisseYuzeysel || r.value || {};
          const code = d.sembol || sample[idx];
          const name = d.aciklama || code;
          const last = (typeof d.kapanis === 'number' && d.kapanis) || (typeof d.satis === 'number' && d.satis) || (typeof d.alis === 'number' && d.alis) || null;
          const changePercent = typeof d.yuzdedegisim === 'number' ? d.yuzdedegisim : null;
          const volumeTL = typeof d.hacimtl === 'number' ? d.hacimtl : null;
          const high = d.yuksek; const low = d.dusuk; const close = d.kapanis; const marketCap = d.piydeg; const beta = d.beta; const time = d.tarih;
          return { code, name, last, changePercent, volumeTL, high, low, close, marketCap, beta, time };
        }).filter(Boolean);

        const cpVals = mapped.map((x) => x.changePercent).filter((v) => typeof v === 'number');
        const volVals = mapped.map((x) => x.volumeTL).filter((v) => typeof v === 'number');
        const withScore = mapped.map((x) => {
          const cpN = normalize(cpVals, x.changePercent);
          const volN = normalize(volVals, x.volumeTL);
          const score = (cpN * 0.6) + (volN * 0.4);
          return { ...x, score };
        });

        const sorted = withScore.sort((a, b) => (b.score || 0) - (a.score || 0));
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

        // Start polling every 20s
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
                  volumeTL: d.hacimtl,
                  marketCap: d.piydeg,
                  beta: d.beta,
                  time: d.tarih,
                };
              });
              setItems((prev) => prev.map((x) => byCode[x.code] ? { ...byCode[x.code], score: x.score } : x));
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
          }, 20000);
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
    const rangePos = (typeof item?.low === 'number' && typeof item?.high === 'number' && last) ? ((last - item.low) / Math.max(0.001, (item.high - item.low))) : null;
    const momentumLabel = (ma5 && last) ? (last >= ma5 ? 'Kısa vadeli momentum pozitif' : 'Kısa vadeli momentum negatif') : '—';
    const trendLabel = (ma20 && last) ? (last >= ma20 ? 'Orta vadeli trend yukarı' : 'Orta vadeli trend aşağı') : '—';
    return { last, ma5, ma20, rangePos, momentumLabel, trendLabel };
  };

  return (
    <div className="space-y-3">
      <SectionTitle>Tavsiye Edilen Hisseler</SectionTitle>
      {loading && (<div className="text-sm text-gray-500">Yükleniyor…</div>)}
      {error && (<div className="text-sm text-red-600">{error}</div>)}
      {!loading && !error && (
        <div className="grid md:grid-cols-2 gap-3">
          {cards.map((it) => {
            const a = analyze(it.code, it);
            const hist = Array.isArray(history[it.code]) ? history[it.code] : [];
            const changeCls = ((it.changePercent || 0) >= 0) ? 'text-green-600' : 'text-red-600';
            return (
              <button key={it.code} className="text-left rounded-xl border bg-white shadow-sm hover:shadow-md focus:outline-none" onClick={() => setModal({ open: true, item: it })}>
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
                </div>
              </button>
            );
          })}
          {!cards.length ? (<div className="p-3 text-sm text-gray-500">Uygun hisse bulunamadı</div>) : null}
        </div>
      )}

      {modal.open && modal.item ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal({ open: false, item: null })} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">{modal.item.name || modal.item.code}</div>
                <div className="text-xs text-gray-500">{modal.item.code}</div>
              </div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setModal({ open: false, item: null })}>✕</button>
            </div>
            <div className="p-4">
              <Sparkline data={Array.isArray(history[modal.item.code]) ? history[modal.item.code] : [modal.item.last || 0]} height={160} />
              <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                <div className="opacity-70">Son</div><div className="text-right">{formatNumber(modal.item.last)}</div>
                <div className="opacity-70">Değişim</div><div className="text-right">{typeof modal.item.changePercent === 'number' ? `${modal.item.changePercent > 0 ? '+' : ''}${modal.item.changePercent.toFixed(2)}%` : '—'}</div>
                <div className="opacity-70">En yüksek</div><div className="text-right">{formatNumber(modal.item.high)}</div>
                <div className="opacity-70">En düşük</div><div className="text-right">{formatNumber(modal.item.low)}</div>
                <div className="opacity-70">Hacim (TL)</div><div className="text-right">{formatNumber(modal.item.volumeTL, 0)}</div>
                <div className="opacity-70">Piyasa değeri</div><div className="text-right">{formatNumber(modal.item.marketCap, 0)}</div>
                <div className="opacity-70">Güncelleme zamanı</div><div className="text-right">{modal.item.time || '—'}</div>
              </div>
            </div>
            <div className="p-4 border-t text-right">
              <button className="btn" onClick={() => setModal({ open: false, item: null })}>Kapat</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="text-xs text-gray-400">Güncelleme aralığı ~20sn.</div>
    </div>
  );
}