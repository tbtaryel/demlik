import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FinanceAPI from '../api/finance.js';
import ContentBlock from '../components/ContentBlock.jsx';

export default function Credit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ amount: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError('Geçerli bir tutar girin');
      return;
    }
    setSaving(true);
    try {
      await FinanceAPI.createTransaction({ type: 'credit', amount, notes: form.notes || undefined });
      navigate('/statements');
    } catch (err) {
      setError(err?.response?.data?.error || 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Kredi Kullan</h1>
      <ContentBlock slug="credit" className="mb-2" />
      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tutar</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border p-2" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Not</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border p-2" placeholder="Opsiyonel" />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Kaydet</button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border">İptal</button>
        </div>
      </form>
    </div>
  );
}