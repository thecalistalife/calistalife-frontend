import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store';
import { formatPrice } from '../utils';
import { Trash2, Plus, Minus, X } from 'lucide-react';

export const MiniCartDrawer = () => {
  const isOpen = useCartStore((s) => s.isOpen);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={toggleCart}
          />
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white z-[61] shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <button onClick={toggleCart} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center text-gray-600 mt-20">Your cart is empty.</div>
              ) : (
                items.map((it) => (
                  <div key={`${it.product.id}-${it.size}-${it.color}`} className="flex gap-3 border rounded-lg p-3">
                    <img
                      src={it.product.images[0]}
                      alt={it.product.name}
                      className="w-20 h-20 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/100x100?text=${encodeURIComponent(it.product.name)}`;
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium leading-tight">{it.product.name}</div>
                          <div className="text-xs text-gray-600">{it.size} / {it.color}</div>
                        </div>
                        <button onClick={() => removeItem(it.product.id, it.size, it.color)} className="text-gray-500 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(it.product.id, it.size, it.color, Math.max(1, it.quantity - 1))} className="p-1 border rounded">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm">{it.quantity}</span>
                          <button onClick={() => updateQuantity(it.product.id, it.size, it.color, it.quantity + 1)} className="p-1 border rounded">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm font-semibold">{formatPrice(it.product.price * it.quantity)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <Link
                to="/cart"
                onClick={toggleCart}
                className="block w-full text-center py-3 rounded-lg bg-black text-white font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors"
              >
                View cart
              </Link>
              <Link
                to="/checkout"
                onClick={toggleCart}
                className="block w-full text-center py-3 rounded-lg border-2 border-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all"
              >
                Checkout
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};