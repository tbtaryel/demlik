import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-accent/20 p-4">
        <h1 className="font-semibold">Yönetim Paneli</h1>
      </header>
      <div className="grid md:grid-cols-[240px_1fr]">
        <aside className="border-r border-accent/20 p-4 space-y-2">
          {[
            { to: '/admin', label: 'Dashboard' },
            { to: '/admin/users', label: 'Kullanıcılar' },
            // { to: '/admin/menus', label: 'Menüler' }, // removed
            { to: '/admin/chat', label: 'Sohbet' },
            // { to: '/admin/market', label: 'Piyasa Yapılandırma' },
            { to: '/admin/recommended-stocks', label: 'Tavsiye Hisseler' },
            { to: '/admin/intraday', label: 'Gün İçi İşlem' },
            { to: '/admin/block-trades', label: 'Blok İşlemleri' },
            { to: '/admin/statements', label: 'Ekstreler' },
            { to: '/admin/settings', label: 'Ayarlar' },
            { to: '/admin/bist-graph', label: 'BIST Grafik' },
          ].map((item) => (
            <NavLink key={item.to} to={item.to} end className="block px-3 py-2 rounded-md hover:bg-accent/10">
              {item.label}
            </NavLink>
          ))}
        </aside>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}