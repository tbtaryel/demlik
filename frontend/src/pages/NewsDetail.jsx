import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { NewsAPI } from '../api/news.js';

export default function NewsDetail() {
  const { id } = useParams();
  const index = Number(id);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const list = await NewsAPI.getTrtSonDakika();
        const it = Array.isArray(list) ? list.find((x) => Number(x.id) === index) : null;
        if (mounted) setItem(it || null);
        if (!it) setError('Haber bulunamadı');
      } catch (e) {
        if (mounted) setError('Haber yüklenemedi');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [index]);

  if (loading) return <div className="text-sm text-gray-500">Yükleniyor…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!item) return <div className="text-sm text-gray-500">Kayıt yok</div>;

  return (
    <article className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{item.title}</h1>
        <RouterLink to="/news" className="text-sm text-blue-600">‹ Geri</RouterLink>
      </div>
      <div className="text-xs text-gray-500">{new Date(item.created_at || Date.now()).toLocaleString()}</div>
      {item.image_url ? (
        <img src={item.image_url} alt="" className="w-full h-60 object-cover rounded-xl border" />
      ) : null}
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{item.body || ''}</div>
      {item.link ? (
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white">Kaynağa Git</a>
      ) : null}
    </article>
  );
}