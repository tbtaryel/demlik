import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function About() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Tercihen "hakkimizda" slug; yoksa "hakkinda" dene
      let { data } = await api.get('/pages/hakkimizda');
      setPage(data);
    } catch (e1) {
      try {
        const { data } = await api.get('/pages/hakkinda');
        setPage(data);
      } catch (e2) {
        setError('Sayfa yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Hakkımızda</h1>
      {loading && <div className="p-4 text-gray-500">Yükleniyor…</div>}
      {error && <div className="p-4 text-red-600">{error}</div>}
      {!loading && !error && page && (
        <div className="prose max-w-none">
          {/* İçerik HTML olabilir; güvenli kabul ederek gösteriyoruz */}
          {page.body ? (
            <div dangerouslySetInnerHTML={{ __html: page.body }} />
          ) : (
            <div className="text-gray-600">Henüz içerik girilmemiş.</div>
          )}
        </div>
      )}
    </div>
  );
}