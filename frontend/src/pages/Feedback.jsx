import { useState } from 'react';
import api from '../api/client';

export default function Feedback() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const send = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await api.post('/feedback', { message });
      setStatus('Gönderildi, teşekkürler!');
      setMessage('');
    } catch (err) {
      setStatus(err.response?.data?.error || 'Gönderim başarısız');
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Geri Bildirim</h2>
      <form className="space-y-3" onSubmit={send}>
        <textarea className="w-full border rounded-md p-3" rows="4" placeholder="Mesajınız" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="btn">Gönder</button>
      </form>
      {status && <div className="text-sm">{status}</div>}
    </div>
  );
}