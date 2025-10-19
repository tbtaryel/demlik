import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import ChatWidget from '../components/ChatWidget.jsx';

function BottomNav({ items }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-accent/20 grid grid-cols-5 text-sm">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className="p-3 text-center hover:bg-accent/10" end={item.to === '/'}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const nav = useNavigate();
  const [settings, setSettings] = useState({});
  const [navCfg, setNavCfg] = useState({ enabled: { favorites: true, market: true, news: true, statements: true, more: true }, labels: { favorites: 'Favoriler', market: 'Piyasa', news: 'Haberler', statements: 'İşlem', more: 'Daha fazla' } });
  const tapCountRef = useRef(0);
  const resetTimerRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);

  const onLogoTap = () => {
    tapCountRef.current += 1;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 3000);
    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      clearTimeout(resetTimerRef.current);
      nav('/admin-login');
    }
  };
  useEffect(() => {
    let mounted = true;
    api.get('/settings').then((r) => {
      if (!mounted) return;
      const s = r.data || {};
      // normalize chat_enabled
      const chatEnabled = (s.chat_enabled === true || s.chat_enabled === 'true' || s.chat_enabled === '1');
      setSettings({ ...s, chat_enabled: chatEnabled });
      // theme vars
      const accent = s.accent_color || '#800020';
      const bg = s.bg_color || '#ffffff';
      try {
        document.documentElement.style.setProperty('--accent', accent);
        document.documentElement.style.setProperty('--bg', bg);
      } catch (_) {}
      // user navigation config
      try {
        const raw = s.user_nav_config;
        if (typeof raw === 'string' && raw.trim()) {
          const cfg = JSON.parse(raw);
          setNavCfg((prev) => ({
            enabled: { ...prev.enabled, ...(cfg.enabled || {}) },
            labels: { ...prev.labels, ...(cfg.labels || {}) },
          }));
        }
      } catch (_) {}
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const navItems = [
    navCfg.enabled.favorites ? { to: '/', label: navCfg.labels.favorites } : null,
    navCfg.enabled.market ? { to: '/market', label: navCfg.labels.market } : null,
    navCfg.enabled.news ? { to: '/news', label: navCfg.labels.news } : null,
    navCfg.enabled.statements ? { to: '/statements', label: navCfg.labels.statements } : null,
    navCfg.enabled.more ? { to: '/more', label: navCfg.labels.more } : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg)' }} >
      <header className="sticky top-0 z-10 bg-white border-b border-accent/20 p-4 flex items-center justify-between">
        <h1 className="font-semibold cursor-pointer select-none" onClick={onLogoTap}>{settings.app_name || 'Dia'}</h1>
        {settings.chat_enabled && (
          <button className="px-3 py-2 rounded-md border hover:bg-accent/10" title="Sohbet" onClick={() => setChatOpen(true)}>🎧</button>
        )}
      </header>
      <main className="p-4 max-w-3xl mx-auto">
        <Outlet />
      </main>
      <BottomNav items={navItems} />
      {settings.chat_enabled && chatOpen && (
        <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}