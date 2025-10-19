import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function MenusAdmin() {
  const [menus, setMenus] = useState([]);
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState([]);
  const [menuForm, setMenuForm] = useState({ name: '', code: '' });
  const [itemForm, setItemForm] = useState({ label: '', url: '', sort_order: 0 });
  const [error, setError] = useState('');

  const loadMenus = async () => {
    setError('');
    try {
      const { data } = await api.get('/menus');
      setMenus(data);
    } catch (e) {
      setError('Menüler yüklenemedi');
    }
  };

  const loadItems = async (menuId) => {
    setError('');
    try {
      const { data } = await api.get(`/menus/${menuId}/items`);
      setItems(data);
    } catch (e) {
      setError('Menü öğeleri yüklenemedi');
    }
  };

  useEffect(() => { loadMenus(); }, []);

  const createMenu = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/menus', menuForm);
      setMenuForm({ name: '', code: '' });
      await loadMenus();
    } catch (e) {
      setError('Menü oluşturulamadı');
    }
  };

  const selectMenu = async (m) => {
    setSelected(m);
    await loadItems(m.id);
  };

  const addItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/menus/${selected.id}/items`, { ...itemForm, sort_order: Number(itemForm.sort_order) || 0 });
      setItemForm({ label: '', url: '', sort_order: 0 });
      await loadItems(selected.id);
    } catch (e) {
      setError('Menü öğesi eklenemedi');
    }
  };

  const removeItem = async (itemId) => {
    setError('');
    try {
      await api.delete(`/menus/items/${itemId}`);
      await loadItems(selected.id);
    } catch (e) {
      setError('Menü öğesi silinemedi');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Menüler</h2>
        <form onSubmit={createMenu} className="space-y-2 p-4 border border-accent/20 rounded-md">
          <input className="border border-accent/20 rounded-md px-3 py-2 w-full" placeholder="Menü adı" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} />
          <input className="border border-accent/20 rounded-md px-3 py-2 w-full" placeholder="Kod" value={menuForm.code} onChange={(e) => setMenuForm({ ...menuForm, code: e.target.value })} />
          <button className="btn btn-primary" type="submit">Oluştur</button>
        </form>

        <div className="space-y-2">
          {menus.map((m) => (
            <button key={m.id} onClick={() => selectMenu(m)} className={`block w-full text-left px-3 py-2 rounded-md border border-accent/20 ${selected?.id === m.id ? 'bg-accent/10' : ''}`}>
              {m.name} <span className="opacity-70">({m.code})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Menü Öğeleri</h2>
        {selected ? (
          <>
            <form onSubmit={addItem} className="space-y-2 p-4 border border-accent/20 rounded-md">
              <input className="border border-accent/20 rounded-md px-3 py-2 w-full" placeholder="Etiket" value={itemForm.label} onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })} />
              <input className="border border-accent/20 rounded-md px-3 py-2 w-full" placeholder="URL" value={itemForm.url} onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })} />
              <input className="border border-accent/20 rounded-md px-3 py-2 w-full" placeholder="Sıralama" type="number" value={itemForm.sort_order} onChange={(e) => setItemForm({ ...itemForm, sort_order: e.target.value })} />
              <button className="btn btn-primary" type="submit">Ekle</button>
            </form>

            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="border border-accent/20 rounded-md p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.label}</div>
                    <div className="opacity-70">{it.url} • Sıra: {it.sort_order}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeItem(it.id)} className="btn">Sil</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="opacity-70">Menü seçiniz</div>
        )}
        {error && <div className="text-accent">{error}</div>}
      </div>
    </div>
  );
}