import { useEffect, useMemo, useState } from 'react';
import FinanceAPI from '../../api/finance.js';

function Actions({ item, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const change = async (status) => {
    setBusy(true);
    try {
      await FinanceAPI.adminUpdateTransaction(item.id, status);
      onUpdate && onUpdate();
    } catch (_) {
      alert('Güncelleme başarısız');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex gap-2 text-xs">
      <button disabled={busy} onClick={() => change('approved')} className="px-2 py-1 rounded bg-green-50 text-green-700 disabled:opacity-50">Onayla</button>
      <button disabled={busy} onClick={() => change('rejected')} className="px-2 py-1 rounded bg-red-50 text-red-700 disabled:opacity-50">Reddet</button>
    </div>
  );
}

export default function AdminStatements() {
  const tabs = ['Yatırma', 'Çekim', 'Kredi', 'Tümü'];
  const [tab, setTab] = useState(tabs[0]);
  const type = useMemo(() => (tab === 'Yatırma' ? 'deposit' : tab === 'Çekim' ? 'withdraw' : tab === 'Kredi' ? 'credit' : null), [tab]);
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (type) params.type = type;
      if (status) params.status = status;
      const rows = await FinanceAPI.adminListTransactions(params);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError('Ekstreler alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* on tab/status change */ }, [type, status]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ekstreler Yönetimi</h1>
      <div className="rounded-2xl border bg-white">
        <div className="px-4 pt-3 flex gap-6 text-sm">
          {tabs.map((t) => (
            <button key={t} className={`border-b-2 ${tab===t?'border-blue-600 text-blue-700':'border-transparent text-gray-600'}`} onClick={() => setTab(t)}>{t}</button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-gray-600 text-xs">Durum</label>
            <select className="input text-xs" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="">Hepsi</option>
              <option value="pending">Beklemede</option>
              <option value="approved">Onaylı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
        <div className="px-4 pb-4">
          {error && <div className="text-red-600 py-2">{error}</div>}
          {loading && <div className="text-gray-500 py-2">Yükleniyor...</div>}
          {!loading && !items.length && !error && <div className="text-gray-500 py-6">Veri yok</div>}
          {items.length > 0 && (
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-2 text-left">Kullanıcı</th>
                    <th className="p-2 text-left">Tip</th>
                    <th className="p-2 text-right">Tutar</th>
                    <th className="p-2 text-left">Durum</th>
                    <th className="p-2 text-left">Referans</th>
                    <th className="p-2 text-left">Not</th>
                    <th className="p-2 text-left">Tarih</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b">
                      <td className="p-2">{it.display_name || `#${it.user_id}`}</td>
                      <td className="p-2">{it.type}</td>
                      <td className="p-2 text-right">{Number(it.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                      <td className="p-2">{it.status}</td>
                      <td className="p-2">{it.reference || '-'}</td>
                      <td className="p-2">{it.notes || '-'}</td>
                      <td className="p-2">{new Date(it.created_at).toLocaleString('tr-TR')}</td>
                      <td className="p-2"><Actions item={it} onUpdate={load} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}