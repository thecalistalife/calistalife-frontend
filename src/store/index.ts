import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, WishlistItem, Product, FilterOptions, SortOption } from '../types/index';
import { CartAPI, ProductsAPI } from '../lib/api';
import { trackBrevo } from '../lib/brevoTracker';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, size: string, color: string, quantity?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setItems: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  getTotalItems: () => number;
}

interface SearchStore {
  query: string;
  filters: FilterOptions;
  sortBy: SortOption;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setSortBy: (sortBy: SortOption) => void;
  resetFilters: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      // Helper: check if user is logged in by token presence
      // We avoid importing auth store to keep modules decoupled
      addItem: (product, size, color, quantity = 1) => {
        // Optimistic update locally
        set((state) => {
          const existingItem = state.items.find(
            (item) =>
              item.product.id === product.id &&
              item.size === size &&
              item.color === color
          );

        if (existingItem) {
            return {
              items: state.items.map((item) =>
                item === existingItem
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, size, color, quantity }],
          };
        });

        // Emit marketing cart_updated event (non-blocking)
        try {
          const items = get().items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.quantity }));
          const total = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
          trackBrevo('cart_updated', { items, cartTotal: total });
        } catch {}

        // If logged in, sync with server then refresh from server
        try {
          const token = localStorage.getItem('auth_token');
          if (token) {
            CartAPI.add({ productId: product.id, size, color, quantity, price: product.price })
              .then(async () => {
                // Reload server cart and hydrate UI
                const res = await CartAPI.get();
                const server = res.data.data as any;
                // Hydrate: fetch product details for each item
                const uniqueIds = Array.from(new Set((server.items || []).map((it: any) => it.product_id)));
                const map = new Map<string, any>();
                await Promise.all(uniqueIds.map(async (id: string) => {
                  try {
                    const rp = await ProductsAPI.get(id);
                    const p = rp.data.data as any;
                    map.set(id, { ...p, id: p.id || p._id || p.slug });
                  } catch {}
                }));
                const uiItems: CartItem[] = (server.items || []).map((it: any) => ({
                  product: (() => {
                    const p = map.get(it.product_id);
                    if (!p) return { id: it.product_id, name: `Product ${it.product_id}`, brand: '', price: it.price ?? 0, images: ['https://placehold.co/400x400?text=Product'], description: '', category: '', collection: '', sizes: [], colors: [], tags: [], inStock: true, rating: 0, reviews: 0 } as any;
                    if (typeof p.price !== 'number' && typeof it.price === 'number') p.price = it.price;
                    return p;
                  })(),
                  size: it.size,
                  color: it.color,
                  quantity: it.quantity,
                }));
                set({ items: uiItems });
              })
              .catch(() => { /* ignore */ });
          }
        } catch {}
      },
      removeItem: (productId, size, color) => {
        // Optimistic local removal
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.size === size &&
                item.color === color
              )
          ),
        }));

        // Emit marketing cart_updated event
        try {
          const items = get().items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.quantity }));
          const total = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
          trackBrevo('cart_updated', { items, cartTotal: total });
        } catch {}

        // If logged in, sync with server then refresh from server
        try {
          const token = localStorage.getItem('auth_token');
          if (token) {
            CartAPI.remove({ productId, size, color })
              .then(async () => {
                const res = await CartAPI.get();
                const server = res.data.data as any;
                const uniqueIds = Array.from(new Set((server.items || []).map((it: any) => it.product_id)));
                const map = new Map<string, any>();
                await Promise.all(uniqueIds.map(async (id: string) => {
                  try {
                    const rp = await ProductsAPI.get(id);
                    const p = rp.data.data as any;
                    map.set(id, { ...p, id: p.id || p._id || p.slug });
                  } catch {}
                }));
                const uiItems: CartItem[] = (server.items || []).map((it: any) => ({
                  product: (() => {
                    const p = map.get(it.product_id);
                    if (!p) return { id: it.product_id, name: `Product ${it.product_id}`, brand: '', price: it.price ?? 0, images: ['https://placehold.co/400x400?text=Product'], description: '', category: '', collection: '', sizes: [], colors: [], tags: [], inStock: true, rating: 0, reviews: 0 } as any;
                    if (typeof p.price !== 'number' && typeof it.price === 'number') p.price = it.price;
                    return p;
                  })(),
                  size: it.size,
                  color: it.color,
                  quantity: it.quantity,
                }));
                set({ items: uiItems });
              })
              .catch(() => { /* ignore */ });
          }
        } catch {}
      },
      updateQuantity: (productId, size, color, quantity) => {
        // Optimistic local update
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
            item.size === size &&
            item.color === color
              ? { ...item, quantity }
              : item
          ),
        }));

        // Emit marketing cart_updated event
        try {
          const items = get().items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, qty: i.quantity }));
          const total = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
          trackBrevo('cart_updated', { items, cartTotal: total });
        } catch {}

        // If logged in, sync with server then refresh
        try {
          const token = localStorage.getItem('auth_token');
          if (token) {
            CartAPI.update({ productId, size, color, quantity })
              .then(async () => {
                const res = await CartAPI.get();
                const server = res.data.data as any;
                const uniqueIds = Array.from(new Set((server.items || []).map((it: any) => it.product_id)));
                const map = new Map<string, any>();
                await Promise.all(uniqueIds.map(async (id: string) => {
                  try {
                    const rp = await ProductsAPI.get(id);
                    const p = rp.data.data as any;
                    map.set(id, { ...p, id: p.id || p._id || p.slug });
                  } catch {}
                }));
                const uiItems: CartItem[] = (server.items || []).map((it: any) => ({
                  product: (() => {
                    const p = map.get(it.product_id);
                    if (!p) return { id: it.product_id, name: `Product ${it.product_id}`, brand: '', price: it.price ?? 0, images: ['https://placehold.co/400x400?text=Product'], description: '', category: '', collection: '', sizes: [], colors: [], tags: [], inStock: true, rating: 0, reviews: 0 } as any;
                    if (typeof p.price !== 'number' && typeof it.price === 'number') p.price = it.price;
                    return p;
                  })(),
                  size: it.size,
                  color: it.color,
                  quantity: it.quantity,
                }));
                set({ items: uiItems });
              })
              .catch(() => { /* ignore */ });
          }
        } catch {}
      },
      clearCart: () => {
        // Clear in-memory state immediately
        set({ items: [] });
        // Emit marketing cart_updated = empty
        try { trackBrevo('cart_updated', { items: [], cartTotal: 0 }); } catch {}
        // Also purge persisted cart to avoid stale rehydration
        try { localStorage.removeItem('cart-storage'); } catch {}
        // If logged in, attempt to clear server cart in background
        try {
          const token = localStorage.getItem('auth_token');
          if (token) {
            CartAPI.clear().catch(() => { /* ignore server clear errors */ });
          }
        } catch {}
      },
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setIsOpen: (isOpen) => set({ isOpen }),
      setItems: (items) => set({ items }),
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const exists = state.items.some((item) => item.product.id === product.id);
          if (!exists) {
            return { items: [...state.items, { product }] };
          }
          return state;
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),
      isInWishlist: (productId) => {
        const { items } = get();
        return items.some((item) => item.product.id === productId);
      },
      getTotalItems: () => {
        const { items } = get();
        return items.length;
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);

const initialFilters: FilterOptions = {
  categories: [],
  collections: [],
  brands: [],
  priceRange: [0, 1000],
  sizes: [],
  colors: [],
  inStock: false,
};

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  filters: initialFilters,
  sortBy: 'featured',
  setQuery: (query) => set({ query }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () => set({ filters: initialFilters, query: '' }),
}));