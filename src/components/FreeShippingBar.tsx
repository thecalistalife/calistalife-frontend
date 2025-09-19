import { motion } from 'framer-motion';
import { useCartStore } from '../store';
import { formatPrice } from '../utils';

const FREE_SHIPPING_THRESHOLD = 100;

export const FreeShippingBar = () => {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="sticky top-16 lg:top-20 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="text-xs sm:text-sm text-gray-700 mb-1">
          {progress >= 1 ? (
            <span className="font-medium">You unlocked free shipping! 🎉</span>
          ) : (
            <span>
              You're <span className="font-semibold">{formatPrice(remaining)}</span> away from free shipping
            </span>
          )}
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
          />
        </div>
      </div>
    </div>
  );
};