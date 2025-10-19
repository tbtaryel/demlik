import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';

export default function AdminDynamic() {
  // Known dynamic content slugs injected via ContentBlock on user-facing pages
  const contentSlugs = useMemo(
    () => [
      'market',
      'intraday',
      'ipo',
      'block-trade',
      'growth-stocks',
      'quantitative',
      'news',
      'more',
      'deposit',
      'withdraw',
      'credit',
      'statements',
    ],
    []
  );
  // Dynamic pages used in the app (About tries these slugs)
  const pageSlugs = useMemo(() => ['hakkimizda', 'hakkinda'], []);

  // Content state
  const [contentItems, setContentItems] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [editingContentSlug, setEditingContentSlug] = useState('');
  const [contentForm, setContentForm] = useState({ title: '', slug: '', body: '', image_url: '', published: false });

  // Pages state
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesError, setPagesError] = useState('');
  const [editingPageId, setEditingPageId] = useState(null);
  const [pageForm, setPageForm] = useState({ title: '', slug: '', body: '', published: false });

  // Settings mapping for ContentBlock visibility/remap
  const [settings, setSettings] = useState({});
  const [blocksCfg, setBlocksCfg] = useState({});
  const [settingsStatus, setSettingsStatus] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  const loadContent = async () => {
    setContentLoading(true); setContentError('');
    try {
      const { data } = await api.get('/content');
      setContentItems(Array.isArray(data) ? data : []);
    } catch (_) {
      setContentError('İçerikler yüklenemedi');
      setContentItems([]);
    } finally {
      setContentLoading(false);
    }
  };

  const loadPages = async () => {
    setPagesLoading(true); setPagesError('');
    try {
      const { data } = await api.get('/pages');
      setPages(Array.isArray(data) ? data : []);
    } catch (_) {
      setPagesError('Sayfalar yüklenemedi');
      setPages([]);
    } finally {
      setPagesLoading(false);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true); setSettingsStatus('');
    try {
      const { data } = await api.get('/settings');
      setSettings(data || {});
      let cfg = {};
      try {
        const raw = data?.content_blocks_config;
        if (typeof raw === 'string' && raw.trim()) cfg = JSON.parse(raw);
      } catch (_) { /* ignore */ }
      // initialize defaults if empty
      if (!cfg || typeof cfg !== 'object') cfg = {};
      contentSlugs.forEach((s) => {
        if (!cfg[s]) cfg[s] = { enabled: true, slug: s };
        if (typeof cfg[s].slug !== 'string' || !cfg[s].slug.trim()) cfg[s].slug = s;
        if (typeof cfg[s].enabled !== 'boolean') cfg[s].enabled = true;
      });
      setBlocksCfg(cfg);
    } catch (_) {
      setBlocksCfg(contentSlugs.reduce((acc, s) => { acc[s] = { enabled: true, slug: s }; return acc; }, {}));
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => { loadContent(); loadPages(); loadSettings(); }, []);

  const findContentBySlug = (slug) => contentItems.find((i) => String(i.slug || '').toLowerCase() === String(slug).toLowerCase());

  const startEditContent = (slug) => {
    const existing = findContentBySlug(slug);
    setEditingContentSlug(slug);
    setContentForm({
      title: existing?.title || '',
      slug: slug,
      body: existing?.body || '',
      image_url: existing?.image_url || '',
      published: !!existing?.published,
    });
  };
  const cancelEditContent = () => {
    setEditingContentSlug('');
    setContentForm({ title: '', slug: '', body: '', image_url: '', published: false });
  };
  const saveContent = async () => {
    const existing = findContentBySlug(editingContentSlug);
    try {
      if (existing?.id) {
        await api.put(`/content/${existing.id}`, { ...contentForm, published: contentForm.published ? 1 : 0 });
      } else {
        await api.post('/content', { ...contentForm, published: contentForm.published ? 1 : 0 });
      }
      cancelEditContent();
      await loadContent();
    } catch (_) {
      setContentError('İçerik kaydedilemedi');
    }
  };

  const startEditPage = (p) => {
    setEditingPageId(p?.id || null);
    setPageForm({ title: p?.title || '', slug: p?.slug || '', body: p?.body || '', published: !!p?.published });
  };
  const cancelEditPage = () => {
    setEditingPageId(null);
    setPageForm({ title: '', slug: '', body: '', published: false });
  };
  const savePage = async () => {
    if (!editingPageId) return;
    try {
      await api.put(`/pages/${editingPageId}`, { ...pageForm, published: pageForm.published ? 1 : 0 });
      cancelEditPage();
      await loadPages();
    } catch (_) {
      setPagesError('Sayfa güncellenemedi');
    }
  };

  const saveBlocksCfg = async () => {
    setSettingsStatus('');
    try {
      const current = settings || {};
      const payload = { ...current, content_blocks_config: JSON.stringify(blocksCfg) };
      await api.post('/settings', payload);
      setSettingsStatus('Kaydedildi');
    } catch (e) {
      setSettingsStatus('Kaydetme başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">İçerikler ve Sayfalar</h2>
      </div>

      {/* İçerik Blokları */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">İçerik Blokları</div>
            <div className="text-sm text-accent/70">Uygulama sayfalarının üstünde gösterilen dinamik bloklar</div>
          </div>
          {contentLoading && <div className="text-sm">Yükleniyor...</div>}
        </div>
        {contentError && <div className="text-accent">{contentError}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="px-2 py-2">Sayfa</th>
                <th className="px-2 py-2">Başlık</th>
                <th className="px-2 py-2">Yayın</th>
                <th className="px-2 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {contentSlugs.map((slug) => {
                const ex = findContentBySlug(slug);
                return (
                  <tr key={slug} className="border-b">
                    <td className="px-2 py-2 font-mono">{slug}</td>
                    <td className="px-2 py-2">{ex?.title || '—'}</td>
                    <td className="px-2 py-2">{ex?.published ? 'Evet' : 'Hayır'}</td>
                    <td className="px-2 py-2">
                      <button className="btn" onClick={() => startEditContent(slug)}>{ex ? 'Düzenle' : 'Oluştur'}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editingContentSlug && (
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="text-lg font-semibold">İçerik: {editingContentSlug}</div>
            <div className="grid md:grid-cols-2 gap-3">
              <input className="border rounded p-2" placeholder="Başlık" value={contentForm.title} onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))} />
              <input className="border rounded p-2" placeholder="Slug" value={contentForm.slug} readOnly />
              <input className="border rounded p-2" placeholder="Görsel URL" value={contentForm.image_url} onChange={(e) => setContentForm((f) => ({ ...f, image_url: e.target.value }))} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={contentForm.published} onChange={(e) => setContentForm((f) => ({ ...f, published: e.target.checked }))} />
                Yayınla
              </label>
            </div>
            <textarea className="border rounded p-2 w-full min-h-[160px]" placeholder="İçerik gövdesi" value={contentForm.body} onChange={(e) => setContentForm((f) => ({ ...f, body: e.target.value }))} />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={saveContent}>Kaydet</button>
              <button className="btn" onClick={cancelEditContent}>İptal</button>
            </div>
          </div>
        )}
      </div>

      {/* Görünürlük & Slug Eşleme (Ayarlar) */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Görünürlük ve Slug Eşleme</div>
            <div className="text-sm text-accent/70">Her sayfanın üstünde gösterilecek blok için aktiflik ve slug eşleme</div>
          </div>
          {settingsLoading && <div className="text-sm">Yükleniyor...</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="px-2 py-2">Sayfa</th>
                <th className="px-2 py-2">Aktif</th>
                <th className="px-2 py-2">Slug Eşleme</th>
              </tr>
            </thead>
            <tbody>
              {contentSlugs.map((slug) => (
                <tr key={slug} className="border-b">
                  <td className="px-2 py-2 font-mono">{slug}</td>
                  <td className="px-2 py-2">
                    <input type="checkbox" checked={!!blocksCfg[slug]?.enabled} onChange={(e) => setBlocksCfg((prev) => ({ ...prev, [slug]: { ...(prev[slug] || {}), enabled: e.target.checked } }))} />
                  </td>
                  <td className="px-2 py-2">
                    <input className="border rounded p-2 w-full" value={blocksCfg[slug]?.slug || slug} onChange={(e) => setBlocksCfg((prev) => ({ ...prev, [slug]: { ...(prev[slug] || {}), slug: e.target.value } }))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" onClick={saveBlocksCfg}>Kaydet</button>
          {settingsStatus && <div className="text-sm">{settingsStatus}</div>}
        </div>
      </div>

      {/* Sayfalar (Düzenleme) */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Sayfalar</div>
            <div className="text-sm text-accent/70">Uygulama içindeki dinamik sayfa içerikleri (örn. Hakkımızda)</div>
          </div>
          {pagesLoading && <div className="text-sm">Yükleniyor...</div>}
        </div>
        {pagesError && <div className="text-accent">{pagesError}</div>}
        <div className="text-sm">Beklenen sluglar: {pageSlugs.join(', ')}</div>

        {/* Existing pages list */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-left border-b">
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Başlık</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Yayın</th>
                <th className="px-2 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-2 py-2">{p.id}</td>
                  <td className="px-2 py-2">{p.title}</td>
                  <td className="px-2 py-2 font-mono">{p.slug}</td>
                  <td className="px-2 py-2">{p.published ? 'Evet' : 'Hayır'}</td>
                  <td className="px-2 py-2 flex gap-2">
                    <button className="btn" onClick={() => startEditPage(p)}>Düzenle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingPageId && (
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="text-lg font-semibold">Sayfa Düzenle</div>
            <div className="grid md:grid-cols-2 gap-3">
              <input className="border rounded p-2" placeholder="Başlık" value={pageForm.title} onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))} />
              <input className="border rounded p-2" placeholder="Slug" value={pageForm.slug} onChange={(e) => setPageForm((f) => ({ ...f, slug: e.target.value }))} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={pageForm.published} onChange={(e) => setPageForm((f) => ({ ...f, published: e.target.checked }))} />
                Yayınla
              </label>
            </div>
            <textarea className="border rounded p-2 w-full min-h-[160px]" placeholder="Sayfa gövdesi" value={pageForm.body} onChange={(e) => setPageForm((f) => ({ ...f, body: e.target.value }))} />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={savePage}>Kaydet</button>
              <button className="btn" onClick={cancelEditPage}>İptal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}