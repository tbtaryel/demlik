import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ContentList() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/content').then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">İçerikler</h2>
      <div className="grid gap-4">
        {items.map((c) => (
          <Link key={c.id} to={`/c/${c.slug}`} className="card p-4">
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-accent/70">{new Date(c.created_at).toLocaleString()}</div>
          </Link>
        ))}
        {!items.length && <div className="text-accent/70">Henüz içerik yok.</div>}
      </div>
    </div>
  );
}