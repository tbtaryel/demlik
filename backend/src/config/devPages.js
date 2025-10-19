// In-memory pages store for dev bypass mode
// Provides CRUD functions mirroring the SQL-backed Pages API

let _idSeq = 2;
const pages = [
  { id: 1, title: 'Hakkımızda', slug: 'hakkimizda', body: '<p>Dia hakkında bilgi. Bu içerik admin panelinden yönetilebilir.</p>', published: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export function listPages() {
  return [...pages].sort((a, b) => b.id - a.id);
}

export function getPageBySlug(slug) {
  const s = String(slug || '').toLowerCase();
  return pages.find((p) => p.slug.toLowerCase() === s) || null;
}

export function addPage({ title, slug, body = '', published = 0 }) {
  const t = String(title || '').trim();
  const s = String(slug || '').trim().toLowerCase();
  if (!t || !s) throw new Error('title_and_slug_required');
  if (pages.some((p) => p.slug.toLowerCase() === s)) throw new Error('slug_exists');
  const now = new Date().toISOString();
  const it = { id: _idSeq++, title: t, slug: s, body: String(body || ''), published: published ? 1 : 0, created_at: now, updated_at: now };
  pages.push(it);
  return it;
}

export function updatePage(id, { title, slug, body = '', published = 0 }) {
  const idx = pages.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) throw new Error('not_found');
  const s = String(slug || pages[idx].slug).trim().toLowerCase();
  const t = String(title || pages[idx].title).trim();
  // prevent slug collision with other items
  if (pages.some((p) => p.id !== pages[idx].id && p.slug.toLowerCase() === s)) throw new Error('slug_exists');
  pages[idx] = {
    ...pages[idx],
    title: t,
    slug: s,
    body: String(body || ''),
    published: published ? 1 : 0,
    updated_at: new Date().toISOString(),
  };
  return { ok: true };
}

export function deletePage(id) {
  const idx = pages.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) throw new Error('not_found');
  pages.splice(idx, 1);
  return { ok: true };
}