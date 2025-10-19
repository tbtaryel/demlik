import { useEffect, useState } from 'react';
import { MarketsAPI } from '../../api/markets.js';

function RowEditor({ item, onSave, onDelete }) {
  const [form, setForm] = useState({ ...item });
  useEffect(() => { setForm({ ...item }); }, [item]);
  return (
    <tr className="border-b">
      <td className="p-2"><input className="input" value={form.code || ''} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></td>
      <td className="p-2"><input className="input" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></td>
      <td className="p-2"><input className="input" type="number" value={form.last ?? ''} onChange={(e) => setForm((f) => ({ ...f, last: e.target.value ? Number(e.target.value) : null }))} /></td>
      <td className="p-2"><input className="input" type="number" value={form.change_percent ?? ''} onChange={(e) => setForm((f) => ({ ...f, change_percent: e.target.value ? Number(e.target.value) : null }))} /></td>
      <td className="p-2"><input className="input" value={form.series_json || ''} onChange={(e) => setForm((f) => ({ ...f, series_json: e.target.value }))} placeholder="JSON dizi" /></td>
      <td className="p-2"><input className="input" type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} /></td>
      <td className="p-2 text-center"><input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /></td>
      <td className="p-2 text-right">
        <button className="btn mr-2" onClick={() => onSave(form)}>Kaydet</button>
        <button className="btn" onClick={() => onDelete(form)}>Sil</button>
      </td>
    </tr>
  );
}

export default function AdminRecommendedStocks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const list = await MarketsAPI.getRecommendedAdminList();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError('Liste alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const base = { code: '', name: '', last: null, change_percent: null, series_json: '', sort_order: 0, active: true };
    const res = await MarketsAPI.createRecommended(base);
    if (res?.id) await load();
  };

  const save = async (form) => {
    try {
      if (!form.id) {
        await MarketsAPI.createRecommended(form);
      } else {
        await MarketsAPI.updateRecommended(form.id, form);
      }
      await load();
    } catch (e) {
      setError('Kaydetme başarısız');
    }
  };

  const remove = async (form) => {
    if (!form.id) return;
    try {
      await MarketsAPI.deleteRecommended(form.id);
      await load();
    } catch (e) {
      setError('Silme başarısız');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tavsiye Edilen Hisseler</h2>
        <button className="btn" onClick={create}>Yeni Ekle</button>
      </div>
      {loading ? (<div className="text-sm text-gray-500">Yükleniyor…</div>) : null}
      {error ? (<div className="text-sm text-red-600">{error}</div>) : null}
      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2 text-left">Kod</th>
              <th className="p-2 text-left">Ad</th>
              <th className="p-2 text-right">Son</th>
              <th className="p-2 text-right">Değişim %</th>
              <th className="p-2 text-left">Seri (JSON)</th>
              <th className="p-2 text-right">Sıra</th>
              <th className="p-2 text-center">Aktif</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <RowEditor key={it.id} item={it} onSave={save} onDelete={remove} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}