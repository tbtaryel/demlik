// Lightweight dxFeed wrapper with dynamic import to avoid bundling issues
let FeedCtor = null;
let feed = null;

async function ensureFeedCtor() {
  if (!FeedCtor) {
    const mod = await import('@dxfeed/api');
    FeedCtor = mod.default || mod.Feed || mod;
  }
  return FeedCtor;
}

export async function connectDxFeed(opts = {}) {
  try {
    const Feed = await ensureFeedCtor();
    const url = opts.url || (import.meta.env.VITE_DXFEED_URL || 'wss://demo.dxfeed.com/webservice/cometd');
    const username = opts.username || import.meta.env.VITE_DXFEED_USERNAME;
    const password = opts.password || import.meta.env.VITE_DXFEED_PASSWORD;
    feed = new Feed({ url, username, password });
    await feed.connect();
    return true;
  } catch (err) {
    console.warn('dxFeed connect failed:', err?.message || err);
    feed = null;
    return false;
  }
}

export function subscribeQuotes(symbols = [], onUpdate, onError) {
  if (!feed || !symbols.length) return null;
  const sub = feed.subscribe(['Quote'], symbols);
  if (onUpdate) sub.on('update', onUpdate);
  if (onError) sub.on('error', onError);
  return sub;
}

export function disconnectDxFeed() {
  try {
    if (feed) feed.disconnect();
  } catch (_) {}
  feed = null;
}