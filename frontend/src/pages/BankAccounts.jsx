import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FinanceAPI from '../api/finance.js';

export default function BankAccounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    FinanceAPI.listAccounts()
      .then((rows) => setItems(rows || []))
      .catch((err) => setError(err?.response?.data?.error || 'Hesaplar yüklenemedi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    try {
      await FinanceAPI.deleteAccount(id);
      load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Silme başarısız');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Finansal Kart Yönetimi</h1>
      <Link to="/bank-accounts/add" className="inline-block px-4 py-3 rounded-lg bg-blue-600 text-white font-medium">+ Banka Hesabı Ekle</Link>
      <div className="divide-y rounded-xl border bg-white">
        {loading && <div className="p-4 text-gray-500">Yükleniyor…</div>}
        {!loading && !items.length && <div className="p-4 text-gray-500">Henüz kayıtlı hesap yok</div>}
        {error && <div className="p-4 text-red-600">{error}</div>}
        {items.map((it) => (
          <div key={it.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{it.bank_name} · {it.account_name}</div>
              <div className="text-sm text-gray-500">{it.iban}</div>
            </div>
            <button onClick={() => del(it.id)} className="px-3 py-2 rounded-lg border hover:bg-gray-50">Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
}