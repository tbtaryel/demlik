import { useEffect, useState } from 'react';
import api from '../../api/client';
import PhoneInput, { buildE164 } from '../../components/PhoneInput.jsx';

export default function Users() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', password: '', role: 'user' });
  const [countryCode, setCountryCode] = useState('+90');
  const [localPhone, setLocalPhone] = useState('');
  const [allowedDials, setAllowedDials] = useState(['+90']);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'user', password: '' });

  const load = () => api.get('/users').then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    let mounted = true;
    api.get('/settings').then((r) => {
      if (!mounted) return;
      const s = r.data || {};
      const allowed = String(s.phone_allowed_dials || '+90').split(',').map((x) => x.trim()).filter(Boolean);
      setAllowedDials(allowed.length ? allowed : ['+90']);
      if (!allowed.includes(countryCode)) {
        setCountryCode(allowed[0] || '+90');
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const phoneE164 = buildE164(countryCode, localPhone);
      await api.post('/users', { name: form.name, phone: phoneE164, password: form.password, role: form.role });
      setForm({ name: '', password: '', role: 'user' });
      setLocalPhone('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Ekleme başarısız');
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', role: u.role || 'user', password: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.put(`/users/${editingId}`, editForm);
      setEditingId(null);
      setEditForm({ name: '', email: '', phone: '', role: 'user' });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Güncelleme başarısız');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', email: '', phone: '', role: 'user' });
  };

  const remove = async (id) => {
    if (!confirm('Silinsin mi?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Kullanıcılar</h2>
      <form className="card p-4 grid gap-3 md:grid-cols-2" onSubmit={add}>
        <input className="border rounded-md p-3" placeholder="Ad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <PhoneInput allowedDials={allowedDials} countryCode={countryCode} onCountryChange={setCountryCode} localNumber={localPhone} onLocalNumberChange={setLocalPhone} />
        <input className="border rounded-md p-3" placeholder="Şifre" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="border rounded-md p-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">Kullanıcı</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn-primary md:col-span-2">Ekle</button>
        {error && <div className="text-accent md:col-span-2">{error}</div>}
      </form>
      <div className="space-y-2">
        {items.map((u) => (
          <div key={u.id} className="card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{u.name || u.phone || u.email}</div>
                <div className="text-sm text-accent/70">{u.phone || '—'} • {u.email || '—'} • {u.role}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn" onClick={() => startEdit(u)}>Düzenle</button>
                <button className="btn" onClick={() => remove(u.id)}>Sil</button>
              </div>
            </div>
            {editingId === u.id && (
              <div className="grid gap-2 md:grid-cols-2">
                <input className="border rounded-md p-3" placeholder="Ad" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <input className="border rounded-md p-3" placeholder="Telefon (E.164: +905...)" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                <input className="border rounded-md p-3" placeholder="E-posta (opsiyonel)" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                <select className="border rounded-md p-3" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
                <input className="border rounded-md p-3 md:col-span-2" placeholder="Yeni Şifre (opsiyonel)" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                <div className="md:col-span-2 flex gap-2">
                  <button className="btn-primary" onClick={saveEdit}>Kaydet</button>
                  <button className="btn" onClick={cancelEdit}>İptal</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!items.length && <div className="text-accent/70">Kayıt yok.</div>}
      </div>
    </div>
  );
}