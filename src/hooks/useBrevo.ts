import { useEffect, useRef } from 'react';
import { loadBrevo, identifyBrevo, trackBrevo } from '../lib/brevoTracker';

export function useBrevoBoot(maKey?: string) {
  useEffect(() => { if (maKey) loadBrevo(maKey); }, [maKey]);
}

export function useBrevoIdentify(email?: string, attrs?: Record<string, any>) {
  const did = useRef(false);
  useEffect(() => {
    if (email && !did.current) {
      identifyBrevo(email, attrs);
      did.current = true;
    }
  }, [email, attrs]);
}

export function useProductViewTracking(product?: { id: string; name: string; price: number }) {
  useEffect(() => {
    if (product?.id) trackBrevo('product_view', { id: product.id, name: product.name, price: product.price });
  }, [product?.id]);
}

export function useCartTracking(items: Array<{ id: string; name: string; price: number; qty: number }>) {
  useEffect(() => {
    const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    trackBrevo('cart_updated', { items, cartTotal: total });
  }, [JSON.stringify(items)]);
}
