import { useState } from 'react';
import api from '../api/client.js';

export default function KYC() {
  const [name, setName] = useState('');
  const [idNo, setIdNo] = useState('');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [status, setStatus] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      // Placeholder: send a feedback record with basic info
      await api.post('/feedback', { message: `KYC request: name=${name}, id=${idNo}` });
      setStatus('Doğrulama talebi gönderildi');
    } catch (e) {
      setStatus('Gönderim başarısız');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold">Kimlik Doğrulama</h1>
      <input className="w-full border rounded p-3" placeholder="Adınızı girin" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full border rounded p-3" placeholder="T.C. Kimlik Numaranızı girin" value={idNo} onChange={(e) => setIdNo(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <label className="border rounded p-6 text-center cursor-pointer">
          <input type="file" className="hidden" onChange={(e) => setFront(e.target.files?.[0] || null)} />
          <div>Kimliğin Ön Yüzü</div>
        </label>
        <label className="border rounded p-6 text-center cursor-pointer">
          <input type="file" className="hidden" onChange={(e) => setBack(e.target.files?.[0] || null)} />
          <div>Kimliğin Arka Yüzü</div>
        </label>
      </div>
      <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium">Doğrula</button>
      {status && <div className="text-sm text-gray-600">{status}</div>}
      <p className="text-xs text-gray-400">Kişisel bilgileriniz ilgili mevzuat uyarınca belirli sürelerde saklanır ve daha sonra imha edilir.</p>
    </form>
  );
}