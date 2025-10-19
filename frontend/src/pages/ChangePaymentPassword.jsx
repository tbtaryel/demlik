import { useState } from 'react';

export default function ChangePaymentPassword() {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [status, setStatus] = useState('');

  const normalize = (v) => v.replace(/\D+/g, '').slice(0, 6);

  const submit = (e) => {
    e.preventDefault();
    setStatus('');
    if (!newPin || newPin.length !== 6) return setStatus('Yeni ödeme şifresi 6 haneli olmalı');
    if (newPin !== newPin2) return setStatus('Yeni şifreler eşleşmiyor');
    // Demo: backend entegrasyonu olmadan güncellendi kabul ediyoruz
    setStatus('Ödeme şifresi güncellendi (demo)');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold">Ödeme şifresini değiştir</h1>
      <input
        className="w-full border rounded p-3"
        placeholder="Mevcut ödeme şifrenizi girin"
        type="password"
        inputMode="numeric"
        value={oldPin}
        onChange={(e) => setOldPin(normalize(e.target.value))}
      />
      <input
        className="w-full border rounded p-3"
        placeholder="Yeni ödeme şifresi (6 haneli)"
        type="password"
        inputMode="numeric"
        value={newPin}
        onChange={(e) => setNewPin(normalize(e.target.value))}
      />
      <input
        className="w-full border rounded p-3"
        placeholder="Yeni ödeme şifresini tekrar girin"
        type="password"
        inputMode="numeric"
        value={newPin2}
        onChange={(e) => setNewPin2(normalize(e.target.value))}
      />
      <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium">Şifreyi değiştir</button>
      {status && <div className="text-sm text-gray-600">{status}</div>}
    </form>
  );
}