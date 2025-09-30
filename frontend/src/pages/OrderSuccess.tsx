import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Truck, CreditCard } from 'lucide-react';
import { analytics } from '../lib/analytics';
import { motion } from 'framer-motion';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const email = searchParams.get('email');
  const total = searchParams.get('total');

  useEffect(() => {
    // Track successful order completion
    analytics.trackPurchase({
      transaction_id: orderId || 'unknown',
      value: parseFloat(total || '0'),
      currency: 'USD',
      items: [] // This would normally come from order data
    });
  }, [orderId, total]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-16 px-4">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </motion.div>

        {orderId && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-lg shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium">#{orderId}</span>
              </div>
              {email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{email}</span>
                </div>
              )}
              {total && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">${total}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <CreditCard className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Payment Confirmed</h3>
            <p className="text-sm text-gray-600">
              Your payment has been processed successfully
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Package className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Order Processing</h3>
            <p className="text-sm text-gray-600">
              We're preparing your items for shipment
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Truck className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Fast Shipping</h3>
            <p className="text-sm text-gray-600">
              Your order will be shipped within 1-2 business days
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <p className="text-gray-600 mb-6">
            A confirmation email has been sent to your email address with order details and tracking information.
          </p>

          <div className="space-y-3">
            <Link
              to="/orders"
              className="block w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              View Order Status
            </Link>

            <Link
              to="/collections"
              className="block w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </Link>

            <Link
              to="/"
              className="block text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}