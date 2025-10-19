import { useEffect, useState } from 'react';
import { BlockTradesAPI } from '../api/blockTrades.js';
import ContentBlock from '../components/ContentBlock.jsx';

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm border-b-2 ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600'} hover:text-blue-700`}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-28 h-28 rounded-full bg-gray-100 mb-3" />
      <div className="text-gray-500">Veri yok</div>
    </div>
  );
}

export default function BlockTrade() {
  const [tab, setTab] = useState('securities'); // 'securities' | 'list'
  const [securities, setSecurities] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const [sec, lst] = await Promise.all([
          BlockTradesAPI.getSecurities().catch(() => []),
          BlockTradesAPI.getList().catch(() => []),
        ]);
        if (!mounted) return;
        setSecurities(Array.isArray(sec) ? sec : []);
        setListItems(Array.isArray(lst) ? lst : []);
      } catch (e) {
        setError('Veri yüklenemedi');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Blok İşlemi</h1>
      <ContentBlock slug="block-trade" className="mb-2" />
      <div className="rounded-2xl border bg-white">
        <div className="px-4 pt-3">
          <div className="flex gap-6">
            <TabButton active={tab === 'securities'} onClick={() => setTab('securities')}>Hisse Senetleri</TabButton>
            <TabButton active={tab === 'list'} onClick={() => setTab('list')}>Listele</TabButton>
          </div>
        </div>
        <div className="px-4 pb-4">
          {loading && (
            <div className="py-8 text-center text-gray-500">Yükleniyor...</div>
          )}
          {!loading && error && (
            <div className="py-8 text-center text-red-600">{error}</div>
          )}
          {!loading && !error && tab === 'securities' && (
            <div>
              <div className="grid grid-cols-3 text-xs text-gray-500 py-3 border-b">
                <div>Hisse Adı</div>
                <div>Satın alma fiyatı</div>
                <div>Minimum satın alma miktarı</div>
              </div>
              {Array.isArray(securities) && securities.length ? (
                <div>
                  {securities.map((s) => (
                    <div key={`${s.symbol}-${s.id || s.min_qty}`} className="grid grid-cols-3 py-3 border-b text-sm">
                      <div className="text-gray-800">{s.name || s.symbol}</div>
                      <div className="text-gray-800">{Number(s.buy_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-gray-800">{s.min_qty}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          )}

          {!loading && !error && tab === 'list' && (
            <div>
              <div className="grid grid-cols-5 text-xs text-gray-500 py-3 border-b">
                <div>Hisse Adı</div>
                <div>Fiyat</div>
                <div>İşlem Miktarı</div>
                <div>Ciro</div>
                <div>durum</div>
              </div>
              {Array.isArray(listItems) && listItems.length ? (
                <div>
                  {listItems.map((r) => (
                    <div key={r.id} className="grid grid-cols-5 py-3 border-b text-sm">
                      <div className="text-gray-800">{r.symbol}</div>
                      <div className="text-gray-800">{Number(r.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-gray-800">{r.qty}</div>
                      <div className="text-gray-800">{Number(r.turnover || (Number(r.price) * Number(r.qty))).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-gray-800">{r.status || 'beklemede'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}