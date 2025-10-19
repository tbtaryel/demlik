// In-memory content store for dev bypass mode
// Provides CRUD functions that mirror the SQL-backed content API

let _idSeq = 2;
const items = [
  { id: 1, title: 'Welcome', slug: 'welcome', body: 'Merhaba! İçerik sistemi hazır.', image_url: '', published: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export function listContent() {
  // Return shallow copies to avoid external mutation
  return items.map((x) => ({ ...x }));
}

export function getContentBySlug(slug) {
  const it = items.find((x) => String(x.slug) === String(slug));
  return it ? { ...it } : null;
}

export function addContent({ title, slug, body, image_url, published }) {
  if (items.some((x) => String(x.slug) === String(slug))) {
    const err = new Error('Slug exists');
    err.code = 'SLUG_EXISTS';
    throw err;
  }
  const now = new Date().toISOString();
  const next = { id: _idSeq++, title, slug, body: body || '', image_url: image_url || '', published: published ? 1 : 0, created_at: now, updated_at: now };
  items.unshift(next);
  return { id: next.id };
}

export function updateContent(id, { title, slug, body, image_url, published }) {
  const idx = items.findIndex((x) => Number(x.id) === Number(id));
  if (idx === -1) {
    const err = new Error('Not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const next = {
    ...items[idx],
    title: title ?? items[idx].title,
    slug: slug ?? items[idx].slug,
    body: body ?? items[idx].body,
    image_url: image_url ?? items[idx].image_url,
    published: published ? 1 : 0,
    updated_at: new Date().toISOString(),
  };
  items[idx] = next;
  return { ok: true };
}

export function deleteContent(id) {
  const idx = items.findIndex((x) => Number(x.id) === Number(id));
  if (idx === -1) return { ok: true };
  items.splice(idx, 1);
  return { ok: true };
}