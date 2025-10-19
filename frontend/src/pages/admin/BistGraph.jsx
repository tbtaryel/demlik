import { useEffect, useState } from 'react';
import api from '../../api/client.js';

export default function AdminBistGraph() {
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [metricsForm, setMetricsForm] = useState({ high: '', low: '', prev_close: '' });
  const [metricsSaving, setMetricsSaving] = useState(false);
  const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  const [intradayDate, setIntradayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [seriesForm, setSeriesForm] = useState(() => Object.fromEntries(TIMES.map((t) => [t, ''])));
  const [seriesSaving, setSeriesSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError(''); setOkMsg('');
    try {
      const { data } = await api.get('/bist-graph/data');
      const arr = Array.isArray(data) ? data : [];
      // sort desc for display
      const sorted = arr.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
      setItems(sorted);
    } catch (e) {
      setError('Veri okunamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/bist-graph/metrics');
        if (!mounted) return;
        const m = data || {};
        setMetricsForm({
          high: m.high ?? '',
          low: m.low ?? '',
          prev_close: m.prev_close ?? '',
        });
      } catch (_) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load intraday series for selected date
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/bist-graph/intraday', { params: { date: intradayDate } });
        if (!mounted) return;
        const s = data?.series || {};
        const base = Object.fromEntries(TIMES.map((t) => [t, '']));
        const merged = { ...base };
        TIMES.forEach((t) => { if (s[t] != null) merged[t] = String(s[t]); });
        setSeriesForm(merged);
      } catch (_) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [intradayDate]);

  const saveMetrics = async () => {
    setError(''); setOkMsg(''); setMetricsSaving(true);
    try {
      const payload = {};
      if (metricsForm.high !== '') payload.high = Number(metricsForm.high);
      if (metricsForm.low !== '') payload.low = Number(metricsForm.low);
      if (metricsForm.prev_close !== '') payload.prev_close = Number(metricsForm.prev_close);
      await api.put('/bist-graph/metrics', payload);
      setOkMsg('Metrikler kaydedildi');
    } catch (e) {
      setError(e?.response?.data?.error || 'Metrikler kaydedilemedi');
    } finally {
      setMetricsSaving(false);
    }
  };

  const saveIntraday = async () => {
    setError(''); setOkMsg(''); setSeriesSaving(true);
    try {
      const payload = { date: intradayDate, series: {} };
      TIMES.forEach((t) => {
        const v = seriesForm[t];
        if (v !== '') payload.series[t] = Number(v);
      });
      await api.put('/bist-graph/intraday', payload);
      setOkMsg('Gün içi seri kaydedildi');
    } catch (e) {
      setError(e?.response?.data?.error || 'Gün içi seri kaydedilemedi');
    } finally {
      setSeriesSaving(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setOkMsg('');
    const v = Number(value);
    if (!date || Number.isNaN(v)) {
      setError('Tarih ve değer zorunludur');
      return;
    }
    try {
      await api.post('/bist-graph/add', { date, value: v });
      setOkMsg('Kaydedildi');
      setDate('');
      setValue('');
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || 'Kaydetme başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">BIST 100 Veri Girişi</h2>
      </div>

      <div className="card p-4 space-y-3">
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Endeks Değeri</label>
            <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className="input" required />
          </div>
          <button type="submit" className="btn">Kaydet</button>
        </form>
        {okMsg && <div className="text-green-600 text-sm">{okMsg}</div>}
        {error && <div className="text-accent text-sm">{error}</div>}
      </div>

      <div className="card p-4 space-y-3">
        <div className="text-lg font-semibold">Grafik Metrikleri</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Gün İçi En Yüksek</label>
            <input className="input" type="number" step="0.01" value={metricsForm.high} onChange={(e) => setMetricsForm((f) => ({ ...f, high: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Gün İçi En Düşük</label>
            <input className="input" type="number" step="0.01" value={metricsForm.low} onChange={(e) => setMetricsForm((f) => ({ ...f, low: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Önceki Kapanış</label>
            <input className="input" type="number" step="0.01" value={metricsForm.prev_close} onChange={(e) => setMetricsForm((f) => ({ ...f, prev_close: e.target.value }))} />
          </div>
        </div>
        <div>
          <button className="btn" onClick={saveMetrics} disabled={metricsSaving}>{metricsSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="text-lg font-semibold">Gün İçi Seri (08:00–17:00)</div>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Tarih</label>
            <input type="date" value={intradayDate} onChange={(e) => setIntradayDate(e.target.value)} className="input" />
          </div>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          {TIMES.map((t) => (
            <div key={t}>
              <label className="block text-xs mb-1">{t}</label>
              <input className="input" type="number" step="0.01" value={seriesForm[t]} onChange={(e) => setSeriesForm((s) => ({ ...s, [t]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div>
          <button className="btn" onClick={saveIntraday} disabled={seriesSaving}>{seriesSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-lg font-semibold mb-2">Kayıtlı Veriler</div>
        {loading && <div className="text-sm">Yükleniyor...</div>}
        {!loading && !items.length && <div className="text-sm text-gray-500">Henüz veri yok</div>}
        {!!items.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="px-2 py-2">Tarih</th>
                  <th className="px-2 py-2">Değer</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={`${it.date}-${idx}`} className="border-b">
                    <td className="px-2 py-2">{it.date}</td>
                    <td className="px-2 py-2">{Number(it.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}