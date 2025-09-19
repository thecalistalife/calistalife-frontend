import { Link } from 'react-router-dom';
import { useCartStore } from '../store/index';
import { formatPrice } from '../utils/index';
import { Trash2, Plus, Minus } from 'lucide-react';
import { MagneticButton } from '../components/MagneticButton';

export const Cart = () => {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <Link to="/collections" className="px-8 py-4 bg-black text-white font-bold uppercase tracking-wider hover:bg-red-500 transition-colors">
            Shop now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((it) => (
              <div key={`${it.product.id}-${it.size}-${it.color}`} className="flex gap-4 p-4 border rounded-lg">
                <img
                  src={it.product.images[0]}
                  alt={it.product.name}
                  className="w-28 h-28 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://placehold.co/120x120?text=${encodeURIComponent(it.product.name)}&bg=E5E7EB&color=111827`;
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/product/${it.product.id}`} className="font-semibold hover:underline">
                        {it.product.name}
                      </Link>
                      <div className="text-sm text-gray-600 mt-1">{it.size} / {it.color}</div>
                    </div>
                    <button onClick={() => removeItem(it.product.id, it.size, it.color)} className="text-gray-500 hover:text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(it.product.id, it.size, it.color, Math.max(1, it.quantity - 1))} className="p-2 border rounded hover:bg-gray-50">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{it.quantity}</span>
                      <button onClick={() => updateQuantity(it.product.id, it.size, it.color, it.quantity + 1)} className="p-2 border rounded hover:bg-gray-50">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="font-semibold">{formatPrice(it.product.price * it.quantity)}</div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={clearCart} className="text-sm text-gray-600 hover:text-black">Clear cart</button>
          </div>

          {/* Summary */}
          <div className="border rounded-xl p-6 h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between mb-6 text-sm text-gray-600">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <MagneticButton strength={0.2} as="div">
              <button className="w-full py-4 bg-black text-white font-bold uppercase tracking-wider rounded-lg hover:bg-red-500 transition-colors">
                Checkout
              </button>
            </MagneticButton>
            <p className="text-xs text-gray-500 mt-3">Taxes and shipping calculated at checkout.</p>
          </div>
        </div>
      </div>
    </div>
  );
};