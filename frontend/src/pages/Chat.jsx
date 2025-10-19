import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

function Attachment({ url }) {
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  if (isImage) return <img src={url} alt="görsel" className="max-w-full rounded-md" />;
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

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

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
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const send = async (e) => {
    e.preventDefault();
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sohbet</h2>
      <div ref={listRef} className="card p-4 h-[50vh] overflow-y-auto">
        {messages.map((m) => (
          <MsgBubble key={m.id} me={m.sender_id === Number(localStorage.getItem('user_id'))} msg={m} />
        ))}
        {!messages.length && <div className="text-accent/70">Henüz mesaj yok.</div>}
      </div>
      <form className="card p-3 flex gap-2 items-center" onSubmit={send}>
        <input
          className="flex-1 min-w-0 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Mesajınızı yazın"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-primary" disabled={loading}>Gönder</button>
      </form>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}