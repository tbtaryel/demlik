import { useEffect, useMemo, useState } from 'react';
import { IntradayAPI } from '../api/intraday.js';
import FinanceAPI from '../api/finance.js';
import api from '../api/client.js';
import ContentBlock from '../components/ContentBlock.jsx';

function EmptyState({ text = 'Veri yok' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-xl">📈</span>
      </div>
      <div>{text}</div>
    </div>
  );
}

function TabHeader({ tabs, active, onChange }) {
  return (
    <div className="flex space-x-6 border-b mb-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`pb-3 font-medium ${active === t.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SaveOrderTab({ settings }) {
  const [amount, setAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSave = async () => {
    setStatusMsg('');
    const val = Number(amount);
    if (!val || val <= 0) {
      setStatusMsg('Lütfen geçerli bir tutar giriniz');
      return;
    }
    try {
      const created = await IntradayAPI.createOrder(val);
      setStatusMsg(`Emir kaydedildi (#${created.id})`);
      setAmount('');
    } catch (e) {
      setStatusMsg('Kayıt başarısız: ' + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{settings?.title_label || 'Fonlara katılmak'}</h2>
      <div className="flex items-center space-x-3 mb-6">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder={settings?.amount_placeholder || 'Lütfen tutarı giriniz'}
        />
        <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2 rounded">
          {settings?.submit_label || 'Kaydet'}
        </button>
      </div>
      {statusMsg && <div className="mb-6 text-sm text-gray-700">{statusMsg}</div>}
      {settings?.guide_text && (
        <div className="mt-6">
          <div className="font-medium mb-2">Rehber:</div>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{settings.guide_text}</p>
        </div>
      )}
    </div>
  );
}

function OperationsTab({ operations }) {
  if (!operations?.length) return <EmptyState />;
  return (
    <div className="space-y-3">
      {operations.map((op) => (
        <div key={op.id} className="p-4 border rounded">
          <div className="flex items-center justify-between">
            <div className="font-medium">{op.title}</div>
            <div className="text-sm text-gray-500">{op.status}</div>
          </div>
          {op.details_json && (
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">{op.details_json}</pre>
          )}
        </div>
      ))}
    </div>
  );
}

function OperationDetailsTab({ operations }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = useMemo(() => operations?.find((o) => o.id === selectedId) || null, [operations, selectedId]);

  if (!operations?.length) return <EmptyState />;
  return (
    <div>
      <div className="mb-4">
        <select
          value={selectedId || ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          <option value="">İşlem seçiniz</option>
          {operations.map((op) => (
            <option key={op.id} value={op.id}>
              {op.title} (#{op.id})
            </option>
          ))}
        </select>
      </div>
      {selected ? (
        <div className="p-4 border rounded">
          <div className="font-medium mb-2">{selected.title}</div>
          <div className="text-sm text-gray-500 mb-3">Durum: {selected.status}</div>
          {selected.details_json ? (
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{selected.details_json}</pre>
          ) : (
            <EmptyState />
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function ExecutedOrdersTab({ orders }) {
  if (!orders?.length) return <EmptyState />;
  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="border rounded p-4">
          <div className="text-2xl font-semibold mb-4">{Number(o.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <div className="font-medium">{o.application_time ? new Date(o.application_time).toLocaleString('tr-TR', { hour12: false }) : '-'}</div>
              <div>Uygulama zamanı</div>
            </div>
            <div>
              <div className="font-medium">{o.review_time ? new Date(o.review_time).toLocaleString('tr-TR', { hour12: false }) : '-'}</div>
              <div>İnceleme zamanı</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackOrdersTab({ orders }) {
  if (!orders?.length) return <EmptyState />;
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="p-4 border rounded">
          <div className="flex items-center justify-between">
            <div className="font-medium">#{o.id}</div>
            <div className="text-sm text-gray-500">{o.status}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
            <div>
              <div className="font-medium">{Number(o.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
              <div>Tutar</div>
            </div>
            <div>
              <div className="font-medium">{o.application_time ? new Date(o.application_time).toLocaleString('tr-TR', { hour12: false }) : '-'}</div>
              <div>Uygulama zamanı</div>
            </div>
            <div>
              <div className="font-medium">{o.review_time ? new Date(o.review_time).toLocaleString('tr-TR', { hour12: false }) : '-'}</div>
              <div>İnceleme zamanı</div>
            </div>
            <div>
              <div className="font-medium">{o.created_at ? new Date(o.created_at).toLocaleString('tr-TR', { hour12: false }) : '-'}</div>
              <div>Oluşturulma</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PortfolioTab() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError('');
    FinanceAPI.listTransactions()
      .then((rows) => { if (mounted) setTransactions(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (mounted) setTransactions([]); if (mounted) setError('Portföy verisi alınamadı'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => {
    const approved = transactions.filter((t) => t.status === 'approved');
    const dep = approved.filter((t) => t.type === 'deposit').reduce((s, t) => s + Number(t.amount || 0), 0);
    const wit = approved.filter((t) => t.type === 'withdraw').reduce((s, t) => s + Number(t.amount || 0), 0);
    const cre = approved.filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
    return { deposit: dep, withdraw: wit, credit: cre, balance: dep - wit + cre };
  }, [transactions]);

  if (loading) return <div className="p-4 text-gray-500">Yükleniyor…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Toplam Yatırma</div>
          <div className="text-xl font-semibold">{totals.deposit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Toplam Çekim</div>
          <div className="text-xl font-semibold">{totals.withdraw.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Kredi</div>
          <div className="text-xl font-semibold">{totals.credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Tahmini Bakiye</div>
          <div className="text-xl font-semibold">{totals.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div className="rounded-xl border overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2">Tür</th>
              <th className="text-left px-3 py-2">Tutar</th>
              <th className="text-left px-3 py-2">Durum</th>
              <th className="text-left px-3 py-2">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2">{t.type}</td>
                <td className="px-3 py-2">{Number(t.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2">{t.created_at ? new Date(t.created_at).toLocaleString('tr-TR', { hour12: false }) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IntradayPage() {
  const [active, setActive] = useState('save');
  const [settings, setSettings] = useState(null);
  const [operations, setOperations] = useState([]);
  const [executedOrders, setExecutedOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [tabsConfig, setTabsConfig] = useState({
    enabled: { save: true, ops: true, op_details: true, portfolio: true, track_orders: true, executed: true },
    labels: { save: 'Emir Kaydet', ops: 'İşlemler', op_details: 'İşlem Detayları', portfolio: 'Porföyüm', track_orders: 'Emirleri Takip Et', executed: 'Emir Gerçekleşti' },
    order: { save: 1, ops: 2, op_details: 3, track: 4, executed: 5, portfolio: 6 },
  });

  useEffect(() => {
    IntradayAPI.getSettings().then(setSettings).catch(() => setSettings({}));
    IntradayAPI.listOperations().then(setOperations).catch(() => setOperations([]));
    IntradayAPI.listOrders({ status: 'executed' }).then(setExecutedOrders).catch(() => setExecutedOrders([]));
    IntradayAPI.listOrders().then(setAllOrders).catch(() => setAllOrders([]));
    api.get('/settings').then((r) => {
      try {
        const raw = r?.data?.intraday_tabs_config;
        if (typeof raw === 'string' && raw.trim()) {
          const cfg = JSON.parse(raw);
          setTabsConfig((prev) => ({
            enabled: { ...prev.enabled, ...(cfg.enabled || {}) },
            labels: { ...prev.labels, ...(cfg.labels || {}) },
            order: { ...prev.order, ...(cfg.order || {}) },
          }));
        }
      } catch (_) { /* ignore parse errors */ }
    }).catch(() => {});
  }, []);

  const tabDefs = useMemo(() => ([
    { key: 'save', label: tabsConfig.labels.save || 'Emir Kaydet', enabled: !!tabsConfig.enabled.save },
    { key: 'ops', label: tabsConfig.labels.ops || 'İşlemler', enabled: !!tabsConfig.enabled.ops },
    { key: 'op_details', label: tabsConfig.labels.op_details || 'İşlem Detayları', enabled: !!tabsConfig.enabled.op_details },
    { key: 'track', label: tabsConfig.labels.track_orders || 'Emirleri Takip Et', enabled: !!tabsConfig.enabled.track_orders },
    { key: 'executed', label: tabsConfig.labels.executed || 'Emir Gerçekleşti', enabled: !!tabsConfig.enabled.executed },
    { key: 'portfolio', label: tabsConfig.labels.portfolio || 'Porföyüm', enabled: !!tabsConfig.enabled.portfolio },
  ]), [tabsConfig]);

  const tabs = useMemo(() => {
    const order = tabsConfig.order || {};
    const defOrder = { save: 1, ops: 2, op_details: 3, track: 4, executed: 5, portfolio: 6 };
    return tabDefs
      .filter((d) => d.enabled)
      .sort((a, b) => (order[a.key] ?? defOrder[a.key]) - (order[b.key] ?? defOrder[b.key]))
      .map((d) => ({ key: d.key, label: d.label }));
  }, [tabDefs, tabsConfig.order]);

  useEffect(() => {
    // Eğer aktif sekme devre dışı veya yoksa ilk mevcut sekmeye ayarla
    if (!tabs.some((t) => t.key === active)) {
      const next = tabs[0]?.key || 'save';
      setActive(next);
    }
  }, [tabs]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <ContentBlock slug="intraday" className="mb-4" />
      <TabHeader tabs={tabs} active={active} onChange={setActive} />
      {tabs.some((t) => t.key === active) ? (
        active === 'save' ? <SaveOrderTab settings={settings} /> :
        active === 'ops' ? <OperationsTab operations={operations} /> :
        active === 'op_details' ? <OperationDetailsTab operations={operations} /> :
        active === 'track' ? <TrackOrdersTab orders={allOrders} /> :
        active === 'executed' ? <ExecutedOrdersTab orders={executedOrders} /> :
        active === 'portfolio' ? <PortfolioTab /> :
        <EmptyState />
      ) : <EmptyState />}
    </div>
  );
}