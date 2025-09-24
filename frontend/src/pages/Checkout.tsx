import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store';
import { OrdersAPI } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { formatPrice } from '../utils';
import { useNavigate } from 'react-router-dom';

const Step = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
    {children}
  </motion.div>
);

const PaymentSectionCOD = () => {
  return (
    <div className="rounded-lg border p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Cash on Delivery (COD)</h3>
      <p className="text-sm text-gray-700">
        You will pay in cash when your order is delivered. No online payment is required right now.
      </p>
    </div>
  );
};

export const Checkout = () => {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const toast = useToast();
  const navigate = useNavigate();
  // simple local shipping form state (MVP)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address1, setAddress1] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [email, setEmail] = useState('');

  const validateShipping = () => {
    if (!firstName || !lastName || !address1 || !city || !zip || !email) {
      toast.error('Please fill all shipping fields');
      return false;
    }
    const emailOk = /.+@.+\..+/.test(email);
    if (!emailOk) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (zip.length < 4) {
      toast.error('Please enter a valid postal code');
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    try {
      const orderPayload = {
        items: items.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          image: it.product.images?.[0],
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          price: it.product.price,
        })),
        shippingAddress: { firstName, lastName, address1, city, zip, email },
        billingAddress: { firstName, lastName, address1, city, zip, email },
        subtotal: Math.round(subtotal),
        shippingCost: 0,
        tax: 0,
        totalAmount: Math.round(subtotal),
        payment: { method: 'cod', status: 'pending' },
      };
      const res = await OrdersAPI.create(orderPayload);
      const data = res.data.data as any;
      clearCart();
      toast.success(`Order placed: ${data.orderNumber}`);
      navigate('/order-success', { state: { orderNumber: data.orderNumber } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to place order');
    }
  };

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
                      <input className="border rounded p-3" placeholder="First name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
                      <input className="border rounded p-3" placeholder="Last name" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
                      <input className="md:col-span-2 border rounded p-3" placeholder="Address" value={address1} onChange={(e)=>setAddress1(e.target.value)} required />
                      <input className="border rounded p-3" placeholder="City" value={city} onChange={(e)=>setCity(e.target.value)} required />
                      <input className="border rounded p-3" placeholder="Postal code" value={zip} onChange={(e)=>setZip(e.target.value)} required />
                      <input className="md:col-span-2 border rounded p-3" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                    </form>
                    <div className="mt-6 flex justify-end">
                      <button onClick={() => { if (validateShipping()) setStep('payment'); }} className="px-6 py-3 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors">
                        Continue to payment
                      </button>
                    </div>
                  </Step>
                )}

{step === 'payment' && (
                  <Step>
                    <h2 className="text-xl font-bold mb-4">Payment</h2>
                    <PaymentSectionCOD />
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
                      <button onClick={placeOrder} className="px-6 py-3 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors">
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