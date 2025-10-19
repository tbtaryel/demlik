import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminContent() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', slug: '', body: '', image_url: '', published: false });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', slug: '', body: '', image_url: '', published: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/content');
      setItems(data);
    } catch (_) {
      setItems([]);
      setError('İçerikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/content', { ...form, published: form.published ? 1 : 0 });
      setForm({ title: '', slug: '', body: '', image_url: '', published: false });
      await load();
    } catch (err) {
      setError('İçerik oluşturulamadı');
    }
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditForm({ title: it.title || '', slug: it.slug || '', body: it.body || '', image_url: it.image_url || '', published: !!it.published });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', slug: '', body: '', image_url: '', published: false });
  };
  const saveEdit = async () => {
    if (!editingId) return;
    setError('');
    try {
      await api.put(`/content/${editingId}`, { ...editForm, published: editForm.published ? 1 : 0 });
      cancelEdit();
      await load();
    } catch (e) {
      setError('İçerik güncellenemedi');
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await api.delete(`/content/${id}`);
      await load();
    } catch (e) {
      setError('İçerik silinemedi');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">İçerikler</h2>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading && <div className="text-sm text-accent/70">Yükleniyor…</div>}

      <form className="card p-4 grid gap-3 md:grid-cols-2" onSubmit={add}>
        <input className="border rounded-md p-3" placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="border rounded-md p-3" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <textarea className="border rounded-md p-3 md:col-span-2" placeholder="İçerik" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <input className="border rounded-md p-3 md:col-span-2" placeholder="Görsel URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          <span>Yayınla</span>
        </label>
        <button className="btn-primary md:col-span-2" type="submit">Ekle</button>
      </form>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="card p-3">
            {editingId === it.id ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input className="border rounded-md p-3" placeholder="Başlık" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                <input className="border rounded-md p-3" placeholder="Slug" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
                <textarea className="border rounded-md p-3 md:col-span-2" placeholder="İçerik" value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} />
                <input className="border rounded-md p-3 md:col-span-2" placeholder="Görsel URL" value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={!!editForm.published} onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })} />
                  <span>Yayınla</span>
                </label>
                <div className="md:col-span-2 flex gap-2">
                  <button className="btn-primary" type="button" onClick={saveEdit}>Kaydet</button>
                  <button className="btn" type="button" onClick={cancelEdit}>İptal</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-sm text-accent/70">/{it.slug}</div>
                  {it.published ? <div className="mt-1 text-xs text-green-600">Yayında</div> : <div className="mt-1 text-xs text-gray-500">Taslak</div>}
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={() => startEdit(it)}>Düzenle</button>
                  <button className="btn" onClick={() => remove(it.id)}>Sil</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!items.length && !loading && <div className="text-accent/70">Kayıt yok.</div>}
      </div>
    </div>
  );
}