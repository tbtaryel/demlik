import { useEffect, useMemo, useState } from 'react';
import FinanceAPI from '../api/finance.js';
import ContentBlock from '../components/ContentBlock.jsx';

export default function Statements() {
  const tabs = ['Yatırma', 'Çekim', 'Kredi'];
  const [tab, setTab] = useState(tabs[0]);
  const type = useMemo(() => (tab === 'Yatırma' ? 'deposit' : tab === 'Çekim' ? 'withdraw' : 'credit'), [tab]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    FinanceAPI.listTransactions(type)
      .then((rows) => { if (mounted) setItems(rows || []); })
      .catch((err) => { if (mounted) setError(err?.response?.data?.error || 'Ekstre yüklenemedi'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [type]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Ekstreler</h1>
      <ContentBlock slug="statements" className="mb-2" />
      <div className="flex gap-3 border-b">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 ${tab===t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>{t}</button>
        ))}
      </div>
      <div className="rounded-2xl border bg-white">
        {loading && <div className="p-4 text-gray-500">Yükleniyor…</div>}
        {error && <div className="p-4 text-red-600">{error}</div>}
        {!loading && !items.length && !error && (
          <div className="p-12 text-center text-gray-500">Veri yok</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="p-4 flex items-center justify-between border-t first:border-t-0">
            <div>
              <div className="font-medium">{Number(it.amount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
              <div className="text-sm text-gray-500">Durum: {it.status}</div>
            </div>
            <div className="text-sm text-gray-500">{new Date(it.created_at).toLocaleString('tr-TR')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}