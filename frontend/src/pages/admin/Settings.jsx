import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminSettings() {
  const [settings, setSettings] = useState({ app_name: 'Dia', accent_color: '#800020', logo_url: '', country_label: 'Türkiye', phone_allowed_dials: '+90', more_menu_code: 'more', more_actions_menu_code: 'more_actions', news_rss_url: '', news_feed_urls: '', news_cache_ttl_sec: '120', news_max_items: '10', news_category_whitelist: '["ekonomi","gundem","siyaset","politika"]', bg_color: '#ffffff', chat_enabled: true });
  const [status, setStatus] = useState('');

  const [tabsCfg, setTabsCfg] = useState({
    enabled: { save: true, ops: true, op_details: true, portfolio: true, track_orders: true, executed: true },
    labels: { save: 'Emir Kaydet', ops: 'İşlemler', op_details: 'İşlem Detayları', portfolio: 'Porföyüm', track_orders: 'Emirleri Takip Et', executed: 'Emir Gerçekleşti' },
    order: { save: 1, ops: 2, op_details: 3, track: 4, executed: 5, portfolio: 6 },
  });
  const [navCfg, setNavCfg] = useState({ enabled: { favorites: true, market: true, news: true, statements: true, more: true }, labels: { favorites: 'Favoriler', market: 'Piyasa', news: 'Haberler', statements: 'İşlem', more: 'Daha fazla' } });

  useEffect(() => {
    api.get('/settings').then((r) => {
      const next = { ...settings, ...r.data };
      try {
        const raw = r?.data?.intraday_tabs_config;
        if (typeof raw === 'string' && raw.trim()) {
          const cfg = JSON.parse(raw);
          setTabsCfg((prev) => ({
            enabled: { ...prev.enabled, ...(cfg.enabled || {}) },
            labels: { ...prev.labels, ...(cfg.labels || {}) },
            order: { ...prev.order, ...(cfg.order || {}) },
          }));
        }
      } catch (_) { /* ignore */ }
      try {
        const navRaw = r?.data?.user_nav_config;
        if (typeof navRaw === 'string' && navRaw.trim()) {
          const cfg = JSON.parse(navRaw);
          setNavCfg((prev) => ({
            enabled: { ...prev.enabled, ...(cfg.enabled || {}) },
            labels: { ...prev.labels, ...(cfg.labels || {}) },
          }));
        }
      } catch (_) { /* ignore */ }
      // normalize chat_enabled to boolean
      next.chat_enabled = (next.chat_enabled === true || next.chat_enabled === 'true' || next.chat_enabled === '1');
      setSettings(next);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      const payload = { ...settings, intraday_tabs_config: JSON.stringify(tabsCfg), user_nav_config: JSON.stringify(navCfg), chat_enabled: settings.chat_enabled ? '1' : '0' };
      await api.post('/settings', payload);
      setStatus('Kaydedildi');
    } catch (err) {
      setStatus(err.response?.data?.error || 'Kaydetme başarısız');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ayarlar</h2>
      <form className="card p-4 space-y-3" onSubmit={save}>
        <input className="border rounded-md p-3" placeholder="Uygulama Adı" value={settings.app_name} onChange={(e) => setSettings({ ...settings, app_name: e.target.value })} />
        <input className="border rounded-md p-3" placeholder="Logo URL" value={settings.logo_url} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} />
        <input className="border rounded-md p-3" placeholder="Vurgu Rengi" value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} />
        <input className="border rounded-md p-3" placeholder="Sayfa Arkaplan Rengi" value={settings.bg_color} onChange={(e) => setSettings({ ...settings, bg_color: e.target.value })} />
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!!settings.chat_enabled} onChange={(e) => setSettings({ ...settings, chat_enabled: e.target.checked })} />
          <span>Sohbet butonu aktif</span>
        </label>
        <input className="border rounded-md p-3" placeholder="Ülke Etiketi (örn: Türkiye)" value={settings.country_label} onChange={(e) => setSettings({ ...settings, country_label: e.target.value })} />
        <input className="border rounded-md p-3" placeholder="İzinli Telefon Ülke Kodları (örn: +90, +49)" value={settings.phone_allowed_dials} onChange={(e) => setSettings({ ...settings, phone_allowed_dials: e.target.value })} />

        {/* Haberler */}
        <div className="mt-4 border-t pt-4">
          <div className="font-medium mb-2">Haberler (RSS Kaynak Yönetimi)</div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded-md p-3" placeholder="Haber RSS URL (tek kaynak)" value={settings.news_rss_url || ''} onChange={(e) => setSettings({ ...settings, news_rss_url: e.target.value })} />
            <input className="border rounded-md p-3" placeholder="Cache TTL (saniye)" value={settings.news_cache_ttl_sec || ''} onChange={(e) => setSettings({ ...settings, news_cache_ttl_sec: e.target.value })} />
            <input className="border rounded-md p-3" placeholder="Maksimum Haber Sayısı" value={settings.news_max_items || ''} onChange={(e) => setSettings({ ...settings, news_max_items: e.target.value })} />
          </div>
          <div className="grid gap-3 mt-3">
            <textarea className="border rounded-md p-3" rows={4} placeholder='Haber RSS Kaynakları (JSON dizi) örn: ["https://example.com/rss","https://another.com/feed"]' value={settings.news_feed_urls || ''} onChange={(e) => setSettings({ ...settings, news_feed_urls: e.target.value })} />
            <textarea className="border rounded-md p-3" rows={3} placeholder='Kategori Whitelist (JSON dizi), örn: ["ekonomi","gundem","siyaset","politika"]' value={settings.news_category_whitelist || ''} onChange={(e) => setSettings({ ...settings, news_category_whitelist: e.target.value })} />
          </div>
        </div>

        {/* Kullanıcı Paneli Navigasyon & Tema */}
        <div className="mt-4 border-t pt-4">
          <div className="font-medium mb-2">Kullanıcı Navigasyonu ve Etiketler</div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!navCfg.enabled.favorites} onChange={(e) => setNavCfg({ ...navCfg, enabled: { ...navCfg.enabled, favorites: e.target.checked } })} />
              <span>Favoriler aktif</span>
            </label>
            <input className="border rounded-md p-3" placeholder="Favoriler etiketi" value={navCfg.labels.favorites} onChange={(e) => setNavCfg({ ...navCfg, labels: { ...navCfg.labels, favorites: e.target.value } })} />

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!navCfg.enabled.market} onChange={(e) => setNavCfg({ ...navCfg, enabled: { ...navCfg.enabled, market: e.target.checked } })} />
              <span>Piyasa aktif</span>
            </label>
            <input className="border rounded-md p-3" placeholder="Piyasa etiketi" value={navCfg.labels.market} onChange={(e) => setNavCfg({ ...navCfg, labels: { ...navCfg.labels, market: e.target.value } })} />

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!navCfg.enabled.news} onChange={(e) => setNavCfg({ ...navCfg, enabled: { ...navCfg.enabled, news: e.target.checked } })} />
              <span>Haberler aktif</span>
            </label>
            <input className="border rounded-md p-3" placeholder="Haberler etiketi" value={navCfg.labels.news} onChange={(e) => setNavCfg({ ...navCfg, labels: { ...navCfg.labels, news: e.target.value } })} />

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!navCfg.enabled.statements} onChange={(e) => setNavCfg({ ...navCfg, enabled: { ...navCfg.enabled, statements: e.target.checked } })} />
              <span>İşlem aktif</span>
            </label>
            <input className="border rounded-md p-3" placeholder="İşlem etiketi" value={navCfg.labels.statements} onChange={(e) => setNavCfg({ ...navCfg, labels: { ...navCfg.labels, statements: e.target.value } })} />

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!navCfg.enabled.more} onChange={(e) => setNavCfg({ ...navCfg, enabled: { ...navCfg.enabled, more: e.target.checked } })} />
              <span>Daha fazla aktif</span>
            </label>
            <input className="border rounded-md p-3" placeholder="Daha fazla etiketi" value={navCfg.labels.more} onChange={(e) => setNavCfg({ ...navCfg, labels: { ...navCfg.labels, more: e.target.value } })} />
          </div>
        </div>

        {/* More sayfası menü kodları */}
        <div className="mt-4 border-t pt-4">
          <div className="font-medium mb-2">More Sayfası Yönetimi (Tüm Kullanıcılar)</div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded-md p-3" placeholder="More menü kodu (örn: more)" value={settings.more_menu_code || ''} onChange={(e) => setSettings({ ...settings, more_menu_code: e.target.value })} />
            <input className="border rounded-md p-3" placeholder="More hızlı işlemler menü kodu (örn: more_actions)" value={settings.more_actions_menu_code || ''} onChange={(e) => setSettings({ ...settings, more_actions_menu_code: e.target.value })} />
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="font-medium mb-2">Kullanıcı İşlem Sekmeleri (Tüm Kullanıcılar için)</div>
          {/* Temel sekmeler */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-3 border rounded">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!tabsCfg.enabled.save} onChange={(e) => setTabsCfg({ ...tabsCfg, enabled: { ...tabsCfg.enabled, save: e.target.checked } })} />
                <span>Emir Kaydet aktif</span>
              </label>
              <input className="mt-2 input" value={tabsCfg.labels.save} onChange={(e) => setTabsCfg({ ...tabsCfg, labels: { ...tabsCfg.labels, save: e.target.value } })} />
            </div>
            <div className="p-3 border rounded">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!tabsCfg.enabled.ops} onChange={(e) => setTabsCfg({ ...tabsCfg, enabled: { ...tabsCfg.enabled, ops: e.target.checked } })} />
                <span>İşlemler aktif</span>
              </label>
              <input className="mt-2 input" value={tabsCfg.labels.ops} onChange={(e) => setTabsCfg({ ...tabsCfg, labels: { ...tabsCfg.labels, ops: e.target.value } })} />
            </div>
            <div className="p-3 border rounded">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!tabsCfg.enabled.op_details} onChange={(e) => setTabsCfg({ ...tabsCfg, enabled: { ...tabsCfg.enabled, op_details: e.target.checked } })} />
                <span>İşlem Detayları aktif</span>
              </label>
              <input className="mt-2 input" value={tabsCfg.labels.op_details} onChange={(e) => setTabsCfg({ ...tabsCfg, labels: { ...tabsCfg.labels, op_details: e.target.value } })} />
            </div>
          </div>
          {/* Ek sekmeler */}
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <div className="p-3 border rounded">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!tabsCfg.enabled.track_orders} onChange={(e) => setTabsCfg({ ...tabsCfg, enabled: { ...tabsCfg.enabled, track_orders: e.target.checked } })} />
                <span>Emirleri Takip Et aktif</span>
              </label>
              <input className="mt-2 input" value={tabsCfg.labels.track_orders} onChange={(e) => setTabsCfg({ ...tabsCfg, labels: { ...tabsCfg.labels, track_orders: e.target.value } })} />
            </div>
            <div className="p-3 border rounded">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!tabsCfg.enabled.executed} onChange={(e) => setTabsCfg({ ...tabsCfg, enabled: { ...tabsCfg.enabled, executed: e.target.checked } })} />
                <span>Emir Gerçekleşti aktif</span>
              </label>
              <input className="mt-2 input" value={tabsCfg.labels.executed} onChange={(e) => setTabsCfg({ ...tabsCfg, labels: { ...tabsCfg.labels, executed: e.target.value } })} />
            </div>
            <div className="p-3 border rounded">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!tabsCfg.enabled.portfolio} onChange={(e) => setTabsCfg({ ...tabsCfg, enabled: { ...tabsCfg.enabled, portfolio: e.target.checked } })} />
                <span>Porföyüm aktif</span>
              </label>
              <input className="mt-2 input" value={tabsCfg.labels.portfolio} onChange={(e) => setTabsCfg({ ...tabsCfg, labels: { ...tabsCfg.labels, portfolio: e.target.value } })} />
            </div>
          </div>
          {/* Sıralama */}
          <div className="mt-4">
            <div className="font-medium mb-2">Sekme Sıralaması</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 border rounded">
                <label className="block text-sm mb-1">Emir Kaydet sıra</label>
                <input type="number" className="input" value={tabsCfg.order?.save ?? 1} onChange={(e) => setTabsCfg({ ...tabsCfg, order: { ...tabsCfg.order, save: Number(e.target.value) } })} />
              </div>
              <div className="p-3 border rounded">
                <label className="block text-sm mb-1">İşlemler sıra</label>
                <input type="number" className="input" value={tabsCfg.order?.ops ?? 2} onChange={(e) => setTabsCfg({ ...tabsCfg, order: { ...tabsCfg.order, ops: Number(e.target.value) } })} />
              </div>
              <div className="p-3 border rounded">
                <label className="block text-sm mb-1">İşlem Detayları sıra</label>
                <input type="number" className="input" value={tabsCfg.order?.op_details ?? 3} onChange={(e) => setTabsCfg({ ...tabsCfg, order: { ...tabsCfg.order, op_details: Number(e.target.value) } })} />
              </div>
              <div className="p-3 border rounded">
                <label className="block text-sm mb-1">Emirleri Takip Et sıra</label>
                <input type="number" className="input" value={tabsCfg.order?.track ?? 4} onChange={(e) => setTabsCfg({ ...tabsCfg, order: { ...tabsCfg.order, track: Number(e.target.value) } })} />
              </div>
              <div className="p-3 border rounded">
                <label className="block text-sm mb-1">Emir Gerçekleşti sıra</label>
                <input type="number" className="input" value={tabsCfg.order?.executed ?? 5} onChange={(e) => setTabsCfg({ ...tabsCfg, order: { ...tabsCfg.order, executed: Number(e.target.value) } })} />
              </div>
              <div className="p-3 border rounded">
                <label className="block text-sm mb-1">Porföyüm sıra</label>
                <input type="number" className="input" value={tabsCfg.order?.portfolio ?? 6} onChange={(e) => setTabsCfg({ ...tabsCfg, order: { ...tabsCfg.order, portfolio: Number(e.target.value) } })} />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Küçük sayı daha önde listelenir. Devre dışı bırakılan sekmeler görünmez.</div>
          </div>
        </div>

        <button className="btn-primary">Kaydet</button>
        {status && <div className="text-sm">{status}</div>}
      </form>
    </div>
  );
}