import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store';
import { ConfettiBurst } from './ConfettiBurst';

const FREE_SHIPPING_THRESHOLD_INR = 999; // ₹999 threshold

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));

export const FreeShippingBar = () => {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD_INR);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_INR - subtotal);

  const prevReachedRef = useRef(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const reached = subtotal >= FREE_SHIPPING_THRESHOLD_INR;
    if (reached && !prevReachedRef.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1200);
      return () => clearTimeout(t);
    }
    prevReachedRef.current = reached;
  }, [subtotal]);

  return (
    <div className="sticky top-16 lg:top-20 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      {celebrate && <ConfettiBurst />}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="text-xs sm:text-sm text-gray-700 mb-1">
          {progress >= 1 ? (
            <span className="font-medium">Free delivery unlocked! 🎉</span>
          ) : (
            <span>
              You're <span className="font-semibold">{formatINR(remaining)}₹</span> away from free shipping
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
