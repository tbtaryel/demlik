import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { NewsAPI } from '../api/news.js';
import ContentBlock from '../components/ContentBlock.jsx';

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({ app_name: 'Dia', country_label: 'Türkiye' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      try {
        // Load settings
        api.get('/settings').then((r) => {
          if (!mounted) return;
          const s = r.data || {};
          setSettings({ app_name: s.app_name || 'Dia', country_label: s.country_label || 'Türkiye' });
        }).catch(() => {});

        const list = await NewsAPI.getTrtSonDakika();
        if (mounted) setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        setError('Haberler yüklenemedi');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{settings.app_name || 'Dia'}</h1>
        <div className="text-gray-500">{settings.country_label || 'Türkiye'}</div>
      </header>

      <ContentBlock slug="news" className="mb-2" />

      <div className="mb-2">
        <span className="px-3 py-1 inline-block rounded-full border bg-blue-600 text-white border-blue-600">Son Dakika</span>
      </div>

      {loading && <div className="text-sm text-gray-500">Yükleniyor…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {items.map((it) => (
        <Link key={it.id} to={`/news/${it.id}`} className="rounded-2xl border bg-white shadow-sm overflow-hidden block">
          {it.image_url ? (
            <img src={it.image_url} alt="" className="w-full h-40 object-cover" />
          ) : null}
          <div className="p-4">
            <h2 className="font-semibold text-lg">{it.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{it.body}</p>
            {it.created_at ? (
              <div className="text-xs text-gray-400 mt-2">{new Date(it.created_at).toLocaleString()}</div>
            ) : null}
          </div>
        </Link>
      ))}

      {!loading && !items.length && (
        <div className="rounded-xl border p-6 text-center text-gray-500">Henüz haber bulunmuyor</div>
      )}
    </div>
  );
}