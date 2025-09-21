import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store';
import { formatPrice } from '../utils';
import SimplePaymentForm from '../components/StripeCheckoutForm';

const Step = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
);

const PaymentForm = () => {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  
  const handlePaymentSuccess = () => {
    alert('Payment successful! (Demo mode)');
  };
  
  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };
  
  return (
    <SimplePaymentForm 
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
      totalAmount={subtotal * 100} // Convert to cents
    />
  );
};

export const Checkout = () => {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-sm">
              <span className={step === 'shipping' ? 'font-bold' : 'text-gray-500'}>1. Shipping</span>
              <span>→</span>
              <span className={step === 'payment' ? 'font-bold' : 'text-gray-500'}>2. Payment</span>
              <span>→</span>
              <span className={step === 'review' ? 'font-bold' : 'text-gray-500'}>3. Review</span>
            </div>

            <div className="bg-white border rounded-xl p-6">
              <AnimatePresence mode="wait">
                {step === 'shipping' && (
                  <Step>
                    <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="border rounded p-3" placeholder="First name" />
                      <input className="border rounded p-3" placeholder="Last name" />
                      <input className="md:col-span-2 border rounded p-3" placeholder="Address" />
                      <input className="border rounded p-3" placeholder="City" />
                      <input className="border rounded p-3" placeholder="Postal code" />
                      <input className="md:col-span-2 border rounded p-3" placeholder="Email" />
                    </form>
                    <div className="mt-6 flex justify-end">
                      <button onClick={() => setStep('payment')} className="px-6 py-3 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors">
                        Continue to payment
                      </button>
                    </div>
                  </Step>
                )}

                {step === 'payment' && (
                  <Step>
                    <h2 className="text-xl font-bold mb-4">Payment</h2>
                    <PaymentForm />
                    <div className="mt-6 flex justify-between">
                      <button onClick={() => setStep('shipping')} className="px-6 py-3 border-2 border-black rounded-lg font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all">
                        Back
                      </button>
                      <button onClick={() => setStep('review')} className="px-6 py-3 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors">
                        Review order
                      </button>
                    </div>
                  </Step>
                )}

                {step === 'review' && (
                  <Step>
                    <h2 className="text-xl font-bold mb-4">Review & Place Order</h2>
                    <div className="space-y-3">
                      {items.map((it) => (
                        <div key={`${it.product.id}-${it.size}-${it.color}`} className="flex items-center justify-between text-sm">
                          <span className="truncate">{it.product.name} × {it.quantity}</span>
                          <span>{formatPrice(it.product.price * it.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-between">
                      <button onClick={() => setStep('payment')} className="px-6 py-3 border-2 border-black rounded-lg font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all">
                        Back
                      </button>
                      <button onClick={() => alert('Order placed (demo)!')} className="px-6 py-3 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors">
                        Place order
                      </button>
                    </div>
                  </Step>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="border rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {items.map((it) => (
                <div key={`${it.product.id}-${it.size}-${it.color}`} className="flex items-center justify-between">
                  <span className="truncate">{it.product.name} × {it.quantity}</span>
                  <span>{formatPrice(it.product.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};