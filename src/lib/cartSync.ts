import { CartAPI, ProductsAPI } from './api';
import { useCartStore } from '../store';

// Hydrate server cart items into UI CartItem shape by fetching product details
async function hydrateServerItems(items: Array<{ product_id: string; size: string; color: string; quantity: number; price?: number }>) {
  const uniqueIds = Array.from(new Set(items.map((it) => it.product_id)));
  const productMap = new Map<string, any>();

  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const res = await ProductsAPI.get(id);
        const p = res.data.data as any;
        const normalized = { ...p, id: p.id || p._id || p.slug };
        productMap.set(id, normalized);
      } catch {
        // Fallback minimal product to avoid UI crashes
        productMap.set(id, {
          id,
          name: `Product ${id}`,
          brand: '',
          price: 0,
          images: ['https://placehold.co/400x400?text=Product'],
          description: '',
          category: '',
          collection: '',
          sizes: [],
          colors: [],
          tags: [],
          inStock: true,
          rating: 0,
          reviews: 0,
        });
      }
    })
  );

  return items.map((it) => {
    const product = productMap.get(it.product_id);
    // Ensure price present; prefer product.price, fallback to cart item price
    if (product && typeof product.price !== 'number' && typeof it.price === 'number') {
      product.price = it.price;
    }
    return { product, size: it.size, color: it.color, quantity: it.quantity };
  });
}

// Merge local cart into server on login, then load server cart into UI
export async function mergeLocalToServer() {
  try {
    const localItems = useCartStore.getState().items;
    // Push each local item into server cart (server merges quantities)
    for (const it of localItems) {
      await CartAPI.add({
        productId: it.product.id,
        size: it.size,
        color: it.color,
        quantity: it.quantity,
        price: it.product.price,
      });
    }
  } catch {}
  // Finally load server cart into UI
  await loadServerToStore();
}

export async function loadServerToStore() {
  try {
    const res = await CartAPI.get();
    const server = res.data.data as any;
    const uiItems = await hydrateServerItems(server.items || []);
    useCartStore.getState().setItems(uiItems);
  } catch {
    // If server fetch fails, keep local as-is
  }
}

// Load server cart but do not wipe local items if server is empty
export async function loadServerPreferLocalWhenEmpty() {
  try {
    const local = useCartStore.getState().items;
    const res = await CartAPI.get();
    const server = res.data.data as any;
    const serverItems = server.items || [];
    if (serverItems.length === 0 && local.length > 0) {
      // Keep local cart; optionally push it to server in background
      try {
        for (const it of local) {
          await CartAPI.add({ productId: it.product.id, size: it.size, color: it.color, quantity: it.quantity, price: it.product.price });
        }
      } catch {}
      return;
    }
    const uiItems = await hydrateServerItems(serverItems);
    useCartStore.getState().setItems(uiItems);
  } catch {
    // ignore
  }
}

export function clearLocalCart() {
  useCartStore.getState().setItems([]);
}