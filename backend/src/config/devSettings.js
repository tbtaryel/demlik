// Simple in-memory settings store for dev bypass mode
// Shared across routes so settings changes persist while server is running

const defaultIntraday = JSON.stringify({
  enabled: { portfolio: true, track_orders: true, executed: true },
  labels: { portfolio: 'Porföyüm', track_orders: 'Emirleri Takip Et', executed: 'Emir Gerçekleşti' }
});

const defaultUserNav = JSON.stringify({
  enabled: { favorites: true, market: true, news: true, statements: true, more: true },
  labels: { favorites: 'Favoriler', market: 'Piyasa', news: 'Haberler', statements: 'İşlem', more: 'Daha fazla' }
});

const defaults = {
  app_name: 'Dia',
  accent_color: '#800020',
  logo_url: '',
  country_label: 'Türkiye',
  phone_allowed_dials: '+90',
  more_menu_code: 'more',
  more_actions_menu_code: 'more_actions',
  news_rss_url: '',
  news_feed_urls: '',
  news_cache_ttl_sec: '120',
  news_max_items: '10',
  news_category_whitelist: '["ekonomi","gundem","siyaset","politika"]',
  bg_color: '#ffffff',
  chat_enabled: '1',
  intraday_tabs_config: defaultIntraday,
  user_nav_config: defaultUserNav,
};

export const devSettingsStore = {
  data: { ...defaults },
};

export function getDevSettings() {
  // Return a shallow clone to avoid accidental external mutation
  return { ...devSettingsStore.data };
}

export function setDevSettings(updates = {}) {
  const keys = Object.keys(updates || {});
  for (const k of keys) {
    devSettingsStore.data[k] = String(updates[k]);
  }
  return getDevSettings();
}