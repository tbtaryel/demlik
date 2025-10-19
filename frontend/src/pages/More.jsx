import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/client.js';
import ContentBlock from '../components/ContentBlock.jsx';

export default function More() {
  const [appName, setAppName] = useState('Dia');
  const [actions, setActions] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    let mounted = true;

    const defaultActions = [
      { to: '/deposit', title: 'Para Yatır' },
      { to: '/withdraw', title: 'Para Çek' },
      { to: '/credit', title: 'Kredi Kullan' },
    ];

    const defaultLinks = [
      { to: '/kyc', title: 'Kimlik Doğrulama' },
      { to: '/bank-accounts', title: 'Finansal Kart Yönetimi' },
      { to: '/statements', title: 'İşlem Ekstresi' },
      { to: '/change-login-password', title: 'Giriş şifresini değiştir' },
      { to: '/change-payment-password', title: 'Ödeme şifresini değiştir' },
      { to: '/about', title: 'Hakkımızda' },
    ];

    const load = async () => {
      try {
        const sRes = await api.get('/settings');
        if (!mounted) return;
        const s = sRes.data || {};
        setAppName(s.app_name || 'Dia');

        const actionsCode = (s.more_actions_menu_code || 'more_actions').toLowerCase();
        const linksCode = (s.more_menu_code || 'more').toLowerCase();

        const menusRes = await api.get('/menus');
        if (!mounted) return;
        const menus = menusRes.data || [];
        const actionsMenu = menus.find((m) => String(m.code || '').toLowerCase() === actionsCode);
        const linksMenu = menus.find((m) => String(m.code || '').toLowerCase() === linksCode);

        let nextActions = defaultActions;
        let nextLinks = defaultLinks;

        if (actionsMenu?.id) {
          try {
            const { data } = await api.get(`/menus/${actionsMenu.id}/items`);
            nextActions = (data || []).map((it) => ({ to: it.url, title: it.label }));
          } catch (_) { /* ignore and fallback */ }
        }

        if (linksMenu?.id) {
          try {
            const { data } = await api.get(`/menus/${linksMenu.id}/items`);
            nextLinks = (data || []).map((it) => ({ to: it.url, title: it.label }));
          } catch (_) { /* ignore and fallback */ }
        }

        if (!mounted) return;
        setActions(nextActions);
        setLinks(nextLinks);
      } catch (_) {
        if (!mounted) return;
        setActions(defaultActions);
        setLinks(defaultLinks);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{appName}</h1>
      </header>

      <ContentBlock slug="more" className="mb-2" />

      <div className="rounded-2xl border bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">TRY</div>
            <div className="text-2xl font-semibold">0,00</div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Bakiye: 0,00</div>
            <div>Kullanılmış: 0,00</div>
            <div>Kazanç: 0,00</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {actions.map((m) => (
            <Link key={`${m.to}-${m.title}`} to={m.to} className="py-2 text-center rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">{m.title}</Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white divide-y">
        {links.map((m) => (
          <Link key={`${m.to}-${m.title}`} to={m.to} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <span>{m.title}</span>
            <span className="text-gray-400">›</span>
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <button
          className="btn"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user_id');
            location.href = '/login';
          }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}