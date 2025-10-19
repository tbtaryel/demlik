import { useEffect, useState } from 'react';
import api from '../api/client';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => setSettings({}));
  }, []);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ayarlar</h2>
      <div className="card p-4 space-y-2">
      <div>Uygulama Adı: {settings.app_name || 'Dia'}</div>
        <div>
          Vurgu Rengi: <span style={{ color: settings.accent_color || '#800020' }}>{settings.accent_color || '#800020'}</span>
        </div>
      </div>
    </div>
  );
}