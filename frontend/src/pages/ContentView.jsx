import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function ContentView() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => {
    api.get(`/content/${slug}`).then((r) => setItem(r.data)).catch(() => setItem(null));
  }, [slug]);
  if (!item) return <div>Yükleniyor...</div>;
  return (
    <article className="prose max-w-none">
      <h2>{item.title}</h2>
      {item.image_url && <img src={item.image_url} alt="" className="rounded-md border border-accent/20" />}
      <p className="whitespace-pre-wrap">{item.body}</p>
    </article>
  );
}