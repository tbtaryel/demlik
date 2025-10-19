import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function PagesAdmin() {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState({ title: '', slug: '', body: '', published: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', slug: '', body: '', published: false });

  const loadPages = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/pages');
      setPages(data);
    } catch (e) {
      setError('Sayfalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPages(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/pages', { ...form, published: form.published ? 1 : 0 });
      setForm({ title: '', slug: '', body: '', published: false });
      await loadPages();
    } catch (e) {
      setError('Sayfa oluşturulamadı');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/pages/${id}`);
      await loadPages();
    } catch (e) {
      setError('Sayfa silinemedi');
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({ title: p.title || '', slug: p.slug || '', body: p.body || '', published: !!p.published });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', slug: '', body: '', published: false });
  };
  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.put(`/pages/${editingId}`, { ...editForm, published: editForm.published ? 1 : 0 });
      cancelEdit();
      await loadPages();
    } catch (e) {
      setError('Sayfa güncellenemedi');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Sayfalar</h2>

      <form onSubmit={submit} className="space-y-2 p-4 border border-accent/20 rounded-md">
        <div className="grid md:grid-cols-2 gap-2">
          <input className="border border-accent/20 rounded-md px-3 py-2" placeholder="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="border border-accent/20 rounded-md px-3 py-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>
        <textarea className="border border-accent/20 rounded-md px-3 py-2 w-full" rows={6} placeholder="İçerik" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          <span>Yayınla</span>
        </label>
        <div>
          <button type="submit" className="btn btn-primary">Kaydet</button>
        </div>
        {error && <div className="text-accent">{error}</div>}
      </form>

      <div className="space-y-2">
        <div className="opacity-70">{loading ? 'Yükleniyor...' : `Toplam ${pages.length} sayfa`}</div>
        {pages.map((p) => (
          <div key={p.id} className="border border-accent/20 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.title} <span className="opacity-70">({p.slug})</span></div>
                <div className="opacity-70">{p.published ? 'Yayınlandı' : 'Taslak'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(p)} className="btn">Düzenle</button>
                <button onClick={() => remove(p.id)} className="btn">Sil</button>
              </div>
            </div>
            {editingId === p.id && (
              <div className="grid gap-2">
                <div className="grid md:grid-cols-2 gap-2">
                  <input className="border rounded-md px-3 py-2" placeholder="Başlık" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  <input className="border rounded-md px-3 py-2" placeholder="Slug" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
                </div>
                <textarea className="border rounded-md px-3 py-2 w-full" rows={6} placeholder="İçerik" value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} />
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!editForm.published} onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })} />
                  <span>Yayınla</span>
                </label>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={saveEdit}>Güncelle</button>
                  <button className="btn" onClick={cancelEdit}>İptal</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}