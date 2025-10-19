import { useState } from 'react';

export default function ChangeLoginPassword() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [status, setStatus] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setStatus('');
    if (newPass !== newPass2) return setStatus('Yeni şifreler eşleşmiyor');
    setStatus('Şifreyi değiştirildi (demo)');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold">Giriş şifresini değiştir</h1>
      <input className="w-full border rounded p-3" placeholder="Eski giriş şifrenizi girin" type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
      <input className="w-full border rounded p-3" placeholder="Yeni giriş şifrenizi girin" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
      <input className="w-full border rounded p-3" placeholder="Yeni şifrenizi tekrar girin" type="password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} />
      <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium">Şifreyi değiştir</button>
      {status && <div className="text-sm text-gray-600">{status}</div>}
    </form>
  );
}