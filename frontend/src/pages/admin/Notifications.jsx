import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const load = () => api.get('/notifications').then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(load, []);

  const send = async (e) => {
    e.preventDefault();
    await api.post('/notifications', form);
    setForm({ title: '', message: '' });
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bildirimler</h2>
      <form className="card p-4 space-y-3" onSubmit={send}>
        <input className="border rounded-md p-3" placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="border rounded-md p-3" rows="4" placeholder="Mesaj" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <button className="btn-primary">Gönder</button>
      </form>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="card p-3">
            <div className="font-medium">{n.title}</div>
            <div className="text-sm text-accent/70">{new Date(n.created_at).toLocaleString()}</div>
            <p>{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}