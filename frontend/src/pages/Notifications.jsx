import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Notifications() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/notifications').then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bildirimler</h2>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="card p-3">
            <div className="font-medium">{n.title}</div>
            <div className="text-sm text-accent/70">{new Date(n.created_at).toLocaleString()}</div>
            <p>{n.message}</p>
          </div>
        ))}
        {!items.length && <div className="text-accent/70">Henüz bildirim yok.</div>}
      </div>
    </div>
  );
}