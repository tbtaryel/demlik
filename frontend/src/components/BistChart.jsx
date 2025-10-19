import { useEffect, useRef } from 'react';
import api from '../api/client.js';

export default function BistChart({ height = 220, date }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Load Chart.js from CDN if not present
  const ensureChartJs = () => new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Chart && typeof window.Chart === 'function') {
      return resolve(window.Chart);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => resolve(window.Chart);
    script.onerror = (e) => reject(new Error('Chart.js yüklenemedi'));
    document.head.appendChild(script);
  });

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await ensureChartJs();
        // Intraday: önce seçilen tarihi dene; boşsa en son tarihi yükle
        const fetchIntraday = async (d) => {
          try {
            if (d) {
              const r = await api.get('/bist-graph/intraday', { params: { date: d } });
              return r.data || null;
            }
            const r = await api.get('/bist-graph/intraday');
            return r.data || null;
          } catch (_) {
            return null;
          }
        };
        const intraday = await fetchIntraday(date);
        let series = intraday?.series || {};
        // Seçilen tarihte seri boşsa, en son kayda geri dön
        const hasSeriesValues = series && Object.keys(series).length > 0;
        if (!hasSeriesValues && date) {
          const latest = await fetchIntraday(null);
          series = latest?.series || series;
        }
        // Metrikleri yükle
        let metrics = {};
        try { const mr = await api.get('/bist-graph/metrics'); metrics = mr?.data || {}; } catch (_) {}
        if (!mounted) return;

        const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
        const labels = TIMES;
        let values = TIMES.map((t) => {
          const v = series?.[t];
          if (typeof v === 'number') return v;
          if (v != null) {
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
          }
          return null;
        });
        // Intraday yoksa prev_close ile düz çizgi oluştur
        const hasAnyValue = values.some((v) => typeof v === 'number');
        if (!hasAnyValue && typeof metrics.prev_close === 'number') {
          values = TIMES.map(() => Number(metrics.prev_close));
        }
        // Null'ları önceki değerle doldur; yoksa 0
        let lastSeen = null;
        values = values.map((v) => {
          if (typeof v === 'number') { lastSeen = v; return v; }
          if (lastSeen != null) return lastSeen;
          return 0;
        });

        const minVal = values.reduce((m, v) => (typeof v === 'number' ? Math.min(m, v) : m), Number.POSITIVE_INFINITY);
        const maxVal = values.reduce((m, v) => (typeof v === 'number' ? Math.max(m, v) : m), Number.NEGATIVE_INFINITY);
        const validRange = Number.isFinite(minVal) && Number.isFinite(maxVal) && minVal !== Number.POSITIVE_INFINITY && maxVal !== Number.NEGATIVE_INFINITY;
        const pad = (() => {
          const base = validRange ? Math.max(5, Math.round((maxVal - minVal) * 0.05)) : 10;
          return base === 0 ? 10 : base;
        })();
        const suggestedMin = validRange ? Math.max(0, minVal - pad) : 0;
        const suggestedMax = validRange ? maxVal + pad : 100;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        chartRef.current = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'XU100 (Saatlik)',
              data: values,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.15)',
              borderWidth: 3,
              pointRadius: 0,
              pointHoverRadius: 3,
              pointHitRadius: 6,
              fill: true,
              tension: 0.2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: { point: { radius: 0 } },
            plugins: { legend: { display: true }, tooltip: { enabled: true } },
            scales: {
              x: { title: { display: true, text: 'Saat' } },
              y: { title: { display: true, text: 'Endeks Değeri' }, suggestedMin, suggestedMax },
            },
          },
        });
      } catch (err) {
        console.warn('BistChart init error:', err);
      }
    };
    init();
    return () => {
      mounted = false;
      try { chartRef.current?.destroy?.(); } catch (_) {}
      chartRef.current = null;
    };
  }, [date]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}