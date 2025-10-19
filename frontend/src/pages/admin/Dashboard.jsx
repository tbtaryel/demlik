import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, content: 0, notifications: 0, pages: 0, menus: 0 });
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats({
          users: Number(data?.users ?? 0),
          content: Number(data?.content ?? 0),
          notifications: Number(data?.notifications ?? 0),
          pages: Number(data?.pages ?? 0),
          menus: Number(data?.menus ?? 0),
        });
      } catch (e) {
        try {
          const [u, c, n] = await Promise.all([api.get('/users'), api.get('/content'), api.get('/notifications')]);
          setStats((prev) => ({ ...prev, users: u.data.length, content: c.data.length, notifications: n.data.length }));
        } catch (_) {
          // leave defaults
        }
      }
    };
    load();
  }, []);
  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="card p-4">
        <div className="text-sm text-accent/70">Kullanıcılar</div>
        <div className="text-2xl font-semibold">{stats.users}</div>
      </div>
      <div className="card p-4">
        <div className="text-sm text-accent/70">İçerikler</div>
        <div className="text-2xl font-semibold">{stats.content}</div>
      </div>
      <div className="card p-4">
        <div className="text-sm text-accent/70">Bildirimler</div>
        <div className="text-2xl font-semibold">{stats.notifications}</div>
      </div>
      <div className="card p-4">
        <div className="text-sm text-accent/70">Sayfalar</div>
        <div className="text-2xl font-semibold">{stats.pages}</div>
      </div>
      <div className="card p-4">
        <div className="text-sm text-accent/70">Menüler</div>
        <div className="text-2xl font-semibold">{stats.menus}</div>
      </div>
    </div>
  );
}