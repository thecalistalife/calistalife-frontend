import { upsertContact, trackEventServer } from './marketing';

export type AbandonedCartEntry = {
  email: string;
  items: Array<{ id: string; name?: string; price?: number; qty: number }>;
  cartTotal: number;
  lastUpdated: number;
  abandonedNotified?: boolean;
};

const store = new Map<string, AbandonedCartEntry>();

function ttlMs() {
  const mins = parseInt(process.env.ABANDONED_CART_TTL_MINUTES || '120', 10);
  return Math.max(5, mins) * 60 * 1000; // at least 5 minutes
}

function scanIntervalMs() {
  const secs = parseInt(process.env.ABANDONED_CART_SCAN_SECONDS || '60', 10);
  return Math.max(10, secs) * 1000;
}

export function abandonedCartHeartbeat(email: string, payload: { items: AbandonedCartEntry['items']; cartTotal?: number }) {
  if (!email) return;
  const now = Date.now();
  const prev = store.get(email);
  const total = typeof payload.cartTotal === 'number' ? payload.cartTotal : (payload.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  store.set(email, {
    email,
    items: payload.items || [],
    cartTotal: total,
    lastUpdated: now,
    abandonedNotified: prev?.abandonedNotified && prev.cartTotal === total ? prev.abandonedNotified : false,
  });
}

export function initAbandonedCartScheduler() {
  setInterval(async () => {
    const now = Date.now();
    const threshold = ttlMs();
    for (const [email, entry] of store.entries()) {
      const idle = now - entry.lastUpdated;
      if (idle >= threshold && !entry.abandonedNotified && (entry.items?.length || 0) > 0) {
        try {
          // Enrich contact minimally (optional list add via attributes or Lists UI)
          await upsertContact({ email, attributes: {
            CART_VALUE: entry.cartTotal,
            CART_ITEMS_COUNT: (entry.items || []).reduce((s, i) => s + (i.qty || 0), 0),
            LAST_CART_ITEM: entry.items?.[0]?.name || undefined,
          }, listIds: process.env.BREVO_LIST_ABANDONED ? [parseInt(process.env.BREVO_LIST_ABANDONED, 10)] : undefined });

          await trackEventServer('cart_abandoned', email, { items: entry.items, cartTotal: entry.cartTotal, source: 'calistalife.com' });
          entry.abandonedNotified = true;
          store.set(email, entry);
        } catch (e) {
          // keep entry; will retry next tick
        }
      }
      // Cleanup entries older than 24h to avoid memory leaks
      if (idle > 24 * 60 * 60 * 1000) store.delete(email);
    }
  }, scanIntervalMs());
}
