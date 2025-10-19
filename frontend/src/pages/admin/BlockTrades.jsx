import { useEffect, useState } from 'react';
import { BlockTradesAPI } from '../../api/blockTrades.js';

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2 text-xs">
      <button className="px-2 py-1 rounded bg-blue-50 text-blue-700" onClick={onEdit}>Düzenle</button>
      <button className="px-2 py-1 rounded bg-red-50 text-red-700" onClick={onDelete}>Sil</button>
    </div>
  );
}

export default function AdminBlockTrades() {
  const [tab, setTab] = useState('securities');
  const [securities, setSecurities] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [secForm, setSecForm] = useState({ id: null, symbol: '', name: '', buy_price: '', min_qty: '' });
  const [listForm, setListForm] = useState({ id: null, symbol: '', price: '', qty: '', status: 'open' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [sec, lst] = await Promise.all([BlockTradesAPI.getSecurities(), BlockTradesAPI.getList()]);
      setSecurities(sec); setListItems(lst);
    } catch (e) {
      setError('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const submitSecurity = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { symbol: secForm.symbol, name: secForm.name, buy_price: Number(secForm.buy_price), min_qty: Number(secForm.min_qty) };
      if (secForm.id) await BlockTradesAPI.updateSecurity(secForm.id, payload);
      else await BlockTradesAPI.createSecurity(payload);
      setSecForm({ id: null, symbol: '', name: '', buy_price: '', min_qty: '' });
      await loadAll();
    } catch (e) { setError('Hisse ekleme/düzenleme başarısız'); }
  };

  const deleteSecurity = async (id) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try { await BlockTradesAPI.deleteSecurity(id); await loadAll(); } catch (_) { setError('Hisse silinemedi'); }
  };

  const submitListItem = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { symbol: listForm.symbol, price: Number(listForm.price), qty: Number(listForm.qty), status: listForm.status };
      if (listForm.id) await BlockTradesAPI.updateTrade(listForm.id, payload);
      else await BlockTradesAPI.createTrade(payload);
      setListForm({ id: null, symbol: '', price: '', qty: '', status: 'open' });
      await loadAll();
    } catch (e) { setError('Kayıt ekleme/düzenleme başarısız'); }
  };

  const deleteListItem = async (id) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try { await BlockTradesAPI.deleteTrade(id); await loadAll(); } catch (_) { setError('Kayıt silinemedi'); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Blok İşlemleri Yönetimi</h1>
      <div className="rounded-2xl border bg-white">
        <div className="px-4 pt-3 flex gap-6 text-sm">
          <button className={`border-b-2 ${tab==='securities'?'border-blue-600 text-blue-700':'border-transparent text-gray-600'}`} onClick={()=>setTab('securities')}>Hisse Senetleri</button>
          <button className={`border-b-2 ${tab==='list'?'border-blue-600 text-blue-700':'border-transparent text-gray-600'}`} onClick={()=>setTab('list')}>Listele</button>
        </div>
        <div className="px-4 pb-4">
          {error && <div className="text-red-600 py-2">{error}</div>}
          {loading && <div className="text-gray-500 py-2">Yükleniyor...</div>}

          {tab === 'securities' && (
            <div className="grid md:grid-cols-2 gap-6">
              <form className="space-y-3" onSubmit={submitSecurity}>
                <div className="font-medium">Hisse Tanımı</div>
                <input className="input" placeholder="Sembol (örn: XU100)" value={secForm.symbol} onChange={(e)=>setSecForm({...secForm, symbol:e.target.value})} />
                <input className="input" placeholder="Ad" value={secForm.name} onChange={(e)=>setSecForm({...secForm, name:e.target.value})} />
                <input className="input" placeholder="Satın alma fiyatı" type="number" step="0.01" value={secForm.buy_price} onChange={(e)=>setSecForm({...secForm, buy_price:e.target.value})} />
                <input className="input" placeholder="Minimum satın alma miktarı" type="number" value={secForm.min_qty} onChange={(e)=>setSecForm({...secForm, min_qty:e.target.value})} />
                <div className="flex gap-2">
                  <button className="btn-primary" type="submit">{secForm.id ? 'Güncelle' : 'Ekle'}</button>
                  {secForm.id && <button type="button" className="btn" onClick={()=>setSecForm({ id:null, symbol:'', name:'', buy_price:'', min_qty:'' })}>İptal</button>}
                </div>
              </form>

              <div>
                <div className="grid grid-cols-4 text-xs text-gray-500 py-3 border-b">
                  <div>Hisse Adı</div>
                  <div>Satın alma fiyatı</div>
                  <div>Minimum miktar</div>
                  <div>Aksiyon</div>
                </div>
                {securities.map((s)=> (
                  <div key={s.id} className="grid grid-cols-4 py-3 border-b">
                    <div>{s.name || s.symbol}</div>
                    <div>{Number(s.buy_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>{s.min_qty}</div>
                    <RowActions onEdit={()=>setSecForm({ id:s.id, symbol:s.symbol, name:s.name||'', buy_price:s.buy_price, min_qty:s.min_qty })} onDelete={()=>deleteSecurity(s.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'list' && (
            <div className="grid md:grid-cols-2 gap-6">
              <form className="space-y-3" onSubmit={submitListItem}>
                <div className="font-medium">İşlem Kaydı</div>
                <input className="input" placeholder="Sembol" value={listForm.symbol} onChange={(e)=>setListForm({...listForm, symbol:e.target.value})} />
                <input className="input" placeholder="Fiyat" type="number" step="0.01" value={listForm.price} onChange={(e)=>setListForm({...listForm, price:e.target.value})} />
                <input className="input" placeholder="Miktar" type="number" value={listForm.qty} onChange={(e)=>setListForm({...listForm, qty:e.target.value})} />
                <select className="input" value={listForm.status} onChange={(e)=>setListForm({...listForm, status:e.target.value})}>
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                  <option value="canceled">canceled</option>
                </select>
                <div className="flex gap-2">
                  <button className="btn-primary" type="submit">{listForm.id ? 'Güncelle' : 'Ekle'}</button>
                  {listForm.id && <button type="button" className="btn" onClick={()=>setListForm({ id:null, symbol:'', price:'', qty:'', status:'open' })}>İptal</button>}
                </div>
              </form>

              <div>
                <div className="grid grid-cols-6 text-xs text-gray-500 py-3 border-b">
                  <div>Hisse Adı</div>
                  <div>Fiyat</div>
                  <div>Miktar</div>
                  <div>Ciro</div>
                  <div>Durum</div>
                  <div>Aksiyon</div>
                </div>
                {listItems.map((r)=> (
                  <div key={r.id} className="grid grid-cols-6 py-3 border-b">
                    <div>{r.symbol}</div>
                    <div>{Number(r.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>{r.qty}</div>
                    <div>{Number(r.turnover).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>{r.status || 'open'}</div>
                    <RowActions onEdit={()=>setListForm({ id:r.id, symbol:r.symbol, price:r.price, qty:r.qty, status:r.status||'open' })} onDelete={()=>deleteListItem(r.id)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}