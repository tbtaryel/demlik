import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [adminStats, setAdminStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    const role = localStorage.getItem('role') || 'user';
    const userId = localStorage.getItem('user_id');
    let payload = {};
    try {
      const p = token.split('.')[1];
      if (p) payload = JSON.parse(atob(p));
    } catch (_) { /* ignore */ }
    setUser({ id: userId || payload.id, role, phone: payload.phone, email: payload.email });
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') return;
    Promise.all([api.get('/users'), api.get('/content'), api.get('/notifications')])
      .then(([u, c, n]) => setAdminStats({ users: u.data.length, content: c.data.length, notifications: n.data.length }))
      .catch(() => setAdminStats({ users: 0, content: 0, notifications: 0 }));
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Profil</h2>
      {user ? (
        <div className="card p-4 space-y-2">
          <div>Kullanıcı ID: {user.id || '—'}</div>
          <div>Rol: {user.role || 'user'}</div>
          <div>Telefon: {user.phone || '—'}</div>
          <div>E-posta: {user.email || '—'}</div>

          <div className="mt-3 p-3 rounded-md border border-accent/20">
            <div className="font-medium mb-2">Giriş Bilgileri</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="card p-3">
                <div className="font-semibold mb-1">Kullanıcı Girişi</div>
                <div>Telefon: {user.phone || '—'}</div>
                <div>Şifre: gizli</div>
              </div>
              <div className="card p-3">
                <div className="font-semibold mb-1">Admin Girişi</div>
                <div>E-posta: {user.role === 'admin' ? (user.email || '—') : 'Admin hesabı gerekli'}</div>
                <div>Telefon: {user.role === 'admin' ? (user.phone || '—') : 'Admin hesabı gerekli'}</div>
                <div>Şifre: gizli</div>
                <div className="text-xs opacity-70 mt-1">Admin girişi e-posta veya telefon + şifre ile yapılır.</div>
              </div>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="mt-3 p-3 rounded-md border border-accent/20">
              <div className="font-medium mb-2">Admin Özeti</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="card p-3 text-center">
                  <div className="opacity-70">Kullanıcılar</div>
                  <div className="text-lg font-semibold">{adminStats?.users ?? '—'}</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="opacity-70">İçerikler</div>
                  <div className="text-lg font-semibold">{adminStats?.content ?? '—'}</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="opacity-70">Bildirimler</div>
                  <div className="text-lg font-semibold">{adminStats?.notifications ?? '—'}</div>
                </div>
              </div>
              <div className="mt-3">
                <Link to="/admin" className="btn">Admin Paneline Git</Link>
              </div>
            </div>
          )}
          <button
            className="btn"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              location.href = '/login';
            }}
          >
            Çıkış Yap
          </button>
        </div>
      ) : (
        'Yükleniyor...'
      )}
    </div>
  );
}