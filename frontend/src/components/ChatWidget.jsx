import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import logoUrl from '../assets/globale-logo.svg';

function Attachment({ url }) {
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  if (isImage) {
    return <img src={url} alt="görsel" className="max-w-full rounded-md" />;
  }
  return <a href={url} target="_blank" rel="noreferrer" className="underline">Dosyayı aç</a>;
}

function MsgBubble({ me, msg }) {
  const statusLabel = msg.status === 'edited' ? '(düzenlendi)' : msg.status === 'deleted' ? '(silindi)' : msg.status === 'recalled' ? '(geri alındı)' : '';
  const raw = msg.status === 'deleted' ? 'Mesaj silindi' : msg.status === 'recalled' ? 'Mesaj geri alındı' : msg.body;
  const isAttachment = typeof raw === 'string' && (raw.startsWith('image:') || raw.startsWith('file:'));
  const attachmentUrl = isAttachment ? raw.split(':')[1] : '';
  return (
    <div className={`max-w-[75%] rounded-lg px-3 py-2 mb-2 ${me ? 'bg-accent text-white ml-auto' : 'bg-accent/10'}`}>
      {!isAttachment && <div className="text-sm whitespace-pre-wrap break-words">{raw}</div>}
      {isAttachment && (
        <div className="bg-white/10 rounded-md p-1">
          <Attachment url={attachmentUrl} />
        </div>
      )}
      <div className="text-[11px] opacity-70 mt-1">
        {new Date(msg.created_at).toLocaleTimeString()} {statusLabel}
      </div>
    </div>
  );
}

export default function ChatWidget({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/chat/my');
      setMessages(data);
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    } catch (e) {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [open]);

  const send = async (e) => {
    e?.preventDefault?.();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/chat', { body: text.trim() });
      setText('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Mesaj gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const onPickFile = () => fileRef.current?.click();
  const onFileSelected = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', f);
      const { data } = await api.post('/chat/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const body = `${data.type}:${data.url}`;
      await api.post('/chat', { body });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Dosya yüklenemedi');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-3 top-3 w-[95vw] max-w-md bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-3 border-b border-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
            <span className="font-semibold">Yatırım Danışmanınız</span>
          </div>
          <button className="text-sm" onClick={onClose}>Kapat</button>
        </div>
        <div ref={listRef} className="p-3 h-[50vh] overflow-y-auto">
          {messages.map((m) => (
            <MsgBubble key={m.id} me={m.sender_id === Number(localStorage.getItem('user_id'))} msg={m} />
          ))}
          {!messages.length && <div className="text-accent/70">Henüz mesaj yok.</div>}
        </div>
        <form className="p-3 border-t border-accent/20 flex gap-2 items-center" onSubmit={send}>
          <button type="button" className="px-3 py-2 rounded-md border hover:bg-accent/10" onClick={onPickFile} title="Dosya ekle">📎</button>
          <input type="file" hidden ref={fileRef} onChange={onFileSelected} />
          <input
            className="flex-1 min-w-0 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Mesajınızı yazın"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-primary" disabled={loading}>Gönder</button>
        </form>
        {error && <div className="px-3 pb-3 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}