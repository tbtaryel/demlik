import { useEffect, useState } from 'react';
import { IntradayAPI } from '../../api/intraday.js';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="border rounded p-4">{children}</div>
    </div>
  );
}

export default function AdminIntraday() {
  // Settings
  const [settings, setSettings] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({ amount: '', status: 'executed', application_time: '', review_time: '' });

  // Operations
  const [operations, setOperations] = useState([]);
  const [newOp, setNewOp] = useState({ title: '', status: 'pending', details_json: '' });

  // Error banner state
  const [error, setError] = useState('');

  const loadAll = async () => {
    setError('');
    try {
      const [s, o, ops] = await Promise.all([
        IntradayAPI.getSettings(),
        IntradayAPI.listOrders(),
        IntradayAPI.listOperations(),
      ]);
      setSettings(s || {});
      setOrders(o || []);
      setOperations(ops || []);
    } catch (e) {
      setError('Veriler yüklenemedi');
      // Fallbacks in case one of them failed
      setSettings((prev) => prev ?? {});
      setOrders((prev) => prev ?? []);
      setOperations((prev) => prev ?? []);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    setError('');
    try {
      const updated = await IntradayAPI.saveSettings(settings);
      setSettings(updated);
    } catch (e) {
      setError('Ayarlar kaydedilemedi');
    } finally {
      setSavingSettings(false);
    }
  };

  const createOrder = async () => {
    const amt = Number(newOrder.amount);
    if (!amt || amt <= 0) return alert('Geçerli tutar giriniz');
    setError('');
    try {
      const created = await IntradayAPI.createOrder(amt);
      const payload = { status: newOrder.status };
      if (newOrder.application_time) payload.application_time = newOrder.application_time;
      if (newOrder.review_time) payload.review_time = newOrder.review_time;
      await IntradayAPI.adminUpdateOrder(created.id, payload);
      setNewOrder({ amount: '', status: 'executed', application_time: '', review_time: '' });
      loadAll();
    } catch (e) {
      setError('Emir oluşturma/güncelleme başarısız');
    }
  };

  const updateOrderField = async (id, field, value) => {
    setError('');
    try {
      await IntradayAPI.adminUpdateOrder(id, { [field]: value });
      loadAll();
    } catch (e) {
      setError('Emir güncelleme başarısız');
    }
  };

  const deleteOrder = async (id) => {
    setError('');
    try {
      await IntradayAPI.adminDeleteOrder(id);
      loadAll();
    } catch (e) {
      setError('Emir silme başarısız');
    }
  };

  const createOp = async () => {
    if (!newOp.title) return alert('Başlık gerekli');
    setError('');
    try {
      await IntradayAPI.adminCreateOperation(newOp);
      setNewOp({ title: '', status: 'pending', details_json: '' });
      loadAll();
    } catch (e) {
      setError('İşlem oluşturma başarısız');
    }
  };

  const updateOpField = async (id, field, value) => {
    setError('');
    try {
      await IntradayAPI.adminUpdateOperation(id, { [field]: value });
      loadAll();
    } catch (e) {
      setError('İşlem güncelleme başarısız');
    }
  };

  const deleteOp = async (id) => {
    setError('');
    try {
      await IntradayAPI.adminDeleteOperation(id);
      loadAll();
    } catch (e) {
      setError('İşlem silme başarısız');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <Section title="Ayarlar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Başlık</label>
            <input className="w-full border rounded px-3 py-2" value={settings.title_label || ''} onChange={(e) => setSettings({ ...settings, title_label: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Tutar yer tutucusu</label>
            <input className="w-full border rounded px-3 py-2" value={settings.amount_placeholder || ''} onChange={(e) => setSettings({ ...settings, amount_placeholder: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Buton metni</label>
            <input className="w-full border rounded px-3 py-2" value={settings.submit_label || ''} onChange={(e) => setSettings({ ...settings, submit_label: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Aktif</label>
            <select className="w-full border rounded px-3 py-2" value={settings.active ? 1 : 0} onChange={(e) => setSettings({ ...settings, active: Number(e.target.value) === 1 })}>
              <option value={1}>Aktif</option>
              <option value={0}>Pasif</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Rehber metni</label>
            <textarea rows={6} className="w-full border rounded px-3 py-2" value={settings.guide_text || ''} onChange={(e) => setSettings({ ...settings, guide_text: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={saveSettings} className="bg-blue-600 text-white px-5 py-2 rounded" disabled={savingSettings}>
            {savingSettings ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </Section>

      <Section title="Gerçekleşen Emirler Yönetimi">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input type="number" className="border rounded px-3 py-2" placeholder="Tutar" value={newOrder.amount} onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })} />
          <select className="border rounded px-3 py-2" value={newOrder.status} onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}>
            <option value="pending">pending</option>
            <option value="executed">executed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <input type="datetime-local" className="border rounded px-3 py-2" placeholder="Uygulama zamanı" value={newOrder.application_time} onChange={(e) => setNewOrder({ ...newOrder, application_time: e.target.value })} />
          <input type="datetime-local" className="border rounded px-3 py-2" placeholder="İnceleme zamanı" value={newOrder.review_time} onChange={(e) => setNewOrder({ ...newOrder, review_time: e.target.value })} />
        </div>
        <button onClick={createOrder} className="bg-green-600 text-white px-4 py-2 rounded mb-4">Yeni Emir Ekle</button>
        <div className="divide-y">
          {orders.map((o) => (
            <div key={o.id} className="py-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">#{o.id} — {Number(o.amount).toLocaleString('tr-TR')}</div>
                <div className="text-sm text-gray-500">{o.status}</div>
              </div>
              <div className="flex items-center space-x-2">
                <input type="number" className="border rounded px-2 py-1 w-28" defaultValue={o.amount} onBlur={(e) => updateOrderField(o.id, 'amount', Number(e.target.value))} />
                <select className="border rounded px-2 py-1" defaultValue={o.status} onChange={(e) => updateOrderField(o.id, 'status', e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="executed">executed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <input type="datetime-local" className="border rounded px-2 py-1" defaultValue={o.application_time?.slice(0,16) || ''} onBlur={(e) => updateOrderField(o.id, 'application_time', e.target.value || null)} />
                <input type="datetime-local" className="border rounded px-2 py-1" defaultValue={o.review_time?.slice(0,16) || ''} onBlur={(e) => updateOrderField(o.id, 'review_time', e.target.value || null)} />
                <button onClick={() => deleteOrder(o.id)} className="text-red-600">Sil</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="İşlemler Yönetimi">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input className="border rounded px-3 py-2" placeholder="Başlık" value={newOp.title} onChange={(e) => setNewOp({ ...newOp, title: e.target.value })} />
          <select className="border rounded px-3 py-2" value={newOp.status} onChange={(e) => setNewOp({ ...newOp, status: e.target.value })}>
            <option value="pending">pending</option>
            <option value="running">running</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button onClick={createOp} className="bg-green-600 text-white px-4 py-2 rounded">Yeni İşlem Ekle</button>
          <textarea className="md:col-span-3 border rounded px-3 py-2" rows={4} placeholder="details_json" value={newOp.details_json} onChange={(e) => setNewOp({ ...newOp, details_json: e.target.value })} />
        </div>
        <div className="divide-y">
          {operations.map((op) => (
            <div key={op.id} className="py-3">
              <div className="flex items-center justify-between">
                <input className="border rounded px-2 py-1 flex-1 mr-2" defaultValue={op.title} onBlur={(e) => updateOpField(op.id, 'title', e.target.value)} />
                <select className="border rounded px-2 py-1" defaultValue={op.status} onChange={(e) => updateOpField(op.id, 'status', e.target.value)}>
                  <option value="pending">pending</option>
                  <option value="running">running</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <button onClick={() => deleteOp(op.id)} className="text-red-600 ml-2">Sil</button>
              </div>
              <textarea className="mt-2 w-full border rounded px-2 py-1" rows={3} defaultValue={op.details_json || ''} onBlur={(e) => updateOpField(op.id, 'details_json', e.target.value)} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}