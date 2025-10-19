import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';

function Attachment({ url }) {
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  if (isImage) return <img src={url} alt="görsel" className="max-w-full rounded-md" />;
  return <a href={url} target="_blank" rel="noreferrer" className="underline">Dosyayı aç</a>;
}

function MsgBubble({ me, msg, onEdit, onDelete, onRecall }) {
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
      <div className="text-[11px] opacity-70 mt-1 flex items-center gap-2">
        <span>{new Date(msg.created_at).toLocaleString()} {statusLabel}</span>
        <button className="text-[11px] underline" onClick={() => onEdit(msg)}>Düzenle</button>
        <button className="text-[11px] underline" onClick={() => onDelete(msg)}>Sil</button>
        <button className="text-[11px] underline" onClick={() => onRecall(msg)}>Geri al</button>
      </div>
    </div>
  );
}

export default function AdminChat() {
  const [convos, setConvos] = useState([]);
  const [selected, setSelected] = useState(null); // { user_id, display_name }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(0);
  const listRef = useRef(null);

  const loadConvos = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConvos(data);
    } catch (e) {
      setConvos([]);
    }
  };
  const loadMessages = async () => {
    if (!selected) return;
    try {
      const { data } = await api.get(`/chat/messages?user_id=${selected.user_id}`);
      setMessages(data);
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    } catch (e) {
      setMessages([]);
    }
  };
  const loadMuteStatus = async () => {
    if (!selected) return;
    try {
      const { data } = await api.get(`/chat/admin/mute-status?user_id=${selected.user_id}`);
      setMuted(Number(data?.muted) || 0);
    } catch (e) {
      setMuted(0);
    }
  };

  useEffect(() => {
    loadConvos();
  }, []);
  useEffect(() => {
    loadMessages();
    loadMuteStatus();
  }, [selected]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    setError('');
    try {
      await api.post('/chat', { body: text.trim(), receiver_id: selected.user_id });
      setText('');
      await loadMessages();
    } catch (err) {
      setError(err.response?.data?.error || 'Mesaj gönderilemedi');
    }
  };
  const onEdit = async (msg) => {
    const next = prompt('Mesajı düzenle:', msg.body);
    if (next == null) return;
    try {
      await api.put(`/chat/${msg.id}`, { body: next });
      await loadMessages();
    } catch (e) {
      alert('Düzenleme başarısız');
    }
  };
  const onDelete = async (msg) => {
    if (!confirm('Mesajı silmek istiyor musunuz?')) return;
    try {
      await api.delete(`/chat/${msg.id}`);
      await loadMessages();
    } catch (e) {
      alert('Silme başarısız');
    }
  };
  const onRecall = async (msg) => {
    if (!confirm('Mesajı geri almak istiyor musunuz?')) return;
    try {
      await api.post(`/chat/${msg.id}/recall`);
      await loadMessages();
    } catch (e) {
      alert('Geri alma başarısız');
    }
  };

  const muteUser = async () => {
    if (!selected) return;
    try {
      await api.post('/chat/admin/mute', { user_id: selected.user_id });
      await loadMuteStatus();
    } catch (e) {
      alert('Susturma başarısız');
    }
  };
  const unmuteUser = async () => {
    if (!selected) return;
    try {
      await api.post('/chat/admin/unmute', { user_id: selected.user_id });
      await loadMuteStatus();
    } catch (e) {
      alert('Susturmayı kaldırma başarısız');
    }
  };

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4">
      <aside className="card p-3 space-y-2">
        <div className="text-sm font-semibold mb-2">Sohbetler</div>
        {convos.map((c) => (
          <button
            key={c.user_id}
            className={`w-full text-left px-3 py-2 rounded-md ${selected?.user_id === c.user_id ? 'bg-accent/10' : 'hover:bg-accent/10'}`}
            onClick={() => setSelected(c)}
          >
            <div className="font-medium">{c.display_name || `Kullanıcı #${c.user_id}`}</div>
            <div className="text-[11px] text-accent/70">Son mesaj: {new Date(c.last_at).toLocaleString()}</div>
          </button>
        ))}
        {!convos.length && <div className="text-accent/70">Henüz sohbet yok.</div>}
      </aside>
      <section className="space-y-3">
        <div className="text-xl font-semibold flex items-center gap-3">
          <span>Sohbet: {selected?.display_name || (selected ? `Kullanıcı #${selected.user_id}` : '')}</span>
          {selected && (
            muted ? (
              <button className="btn" onClick={unmuteUser}>Susturmayı Kaldır</button>
            ) : (
              <button className="btn" onClick={muteUser}>Sustur</button>
            )
          )}
        </div>
        <div ref={listRef} className="card p-4 h-[50vh] overflow-y-auto">
          {messages.map((m) => (
            <MsgBubble key={m.id} me={m.sender_id !== selected?.user_id} msg={m} onEdit={onEdit} onDelete={onDelete} onRecall={onRecall} />
          ))}
          {!messages.length && <div className="text-accent/70">Mesaj yok.</div>}
        </div>
        <form className="card p-3 flex gap-2 items-center" onSubmit={send}>
          <input
            className="flex-1 min-w-0 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Mesaj yazın"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!selected}
          />
          <button className="btn-primary" disabled={!selected}>Gönder</button>
        </form>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </section>
    </div>
  );
}