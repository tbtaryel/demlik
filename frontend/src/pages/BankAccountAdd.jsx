import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FinanceAPI from '../api/finance.js';

export default function BankAccountAdd() {
  const nav = useNavigate();
  const [bank_name, setBankName] = useState('');
  const [account_name, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!bank_name || !account_name || !iban) {
      setError('Tüm alanları doldurun');
      return;
    }
    setSaving(true);
    try {
      await FinanceAPI.addAccount({ bank_name, account_name, iban });
      nav('/bank-accounts');
    } catch (err) {
      setError(err?.response?.data?.error || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <h1 className="text-xl font-bold">Banka Hesabı Ekle</h1>
      <input className="w-full border rounded p-3" placeholder="Banka adı" value={bank_name} onChange={(e) => setBankName(e.target.value)} />
      <input className="w-full border rounded p-3" placeholder="Hesap adı" value={account_name} onChange={(e) => setAccountName(e.target.value)} />
      <input className="w-full border rounded p-3" placeholder="IBAN" value={iban} onChange={(e) => setIban(e.target.value)} />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" disabled={saving} className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50">Kaydet</button>
    </form>
  );
}