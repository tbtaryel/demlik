import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function ContentBlock({ slug, className = '' }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    async function load() {
      try {
        // Load settings to decide visibility and slug remapping
        let settingsData = {};
        try {
          const s = await api.get('/settings');
          settingsData = s?.data || {};
        } catch (_) {
          settingsData = {};
        }

        let cfg = {};
        try {
          const raw = settingsData?.content_blocks_config;
          if (typeof raw === 'string' && raw.trim()) cfg = JSON.parse(raw);
        } catch (_) {}
        if (!cfg || typeof cfg !== 'object') cfg = {};

        const entry = cfg[slug] || { enabled: true, slug };
        const enabled = entry.enabled !== false;
        const mappedSlug = typeof entry.slug === 'string' && entry.slug.trim() ? entry.slug.trim() : slug;

        if (!enabled) {
          if (mounted) {
            setItem(null);
          }
          return;
        }

        const r = await api.get(`/content/${mappedSlug}`);
        if (!mounted) return;
        setItem(r.data || null);
      } catch (e) {
        if (!mounted) return;
        setItem(null);
        setError('İçerik yüklenemedi');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) return null;
  if (!item) return null;
  if (item.published === 0 || item.published === false) return null;

  const title = item.title;
  const body = item.body;
  const image = item.image_url;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>
      {image ? (
        <img src={image} alt="" className="w-full h-40 object-cover rounded-t-2xl border-b" />
      ) : null}
      <div className="p-4">
        {title ? <h2 className="text-lg font-semibold mb-2">{title}</h2> : null}
        {body ? (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: body }} />
        ) : null}
      </div>
    </div>
  );
}