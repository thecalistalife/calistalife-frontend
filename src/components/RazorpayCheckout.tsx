import { useState } from 'react';

interface RazorpayButtonProps {
  amountINR: number; // in rupees
  onSuccess: (payload: any) => void;
  onError: (message: string) => void;
}

declare global {
  interface Window { Razorpay?: any }
}

async function loadScript(src: string) {
  return new Promise<boolean>((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function RazorpayCheckout({ amountINR, onSuccess, onError }: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

  const start = async () => {
    try {
      if (!keyId) { onError('Razorpay key is not configured'); return; }
      setLoading(true);
      // Create order on backend (amount in paise)
      const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: Math.round(amountINR * 100) })
      });
      if (!orderRes.ok) { throw new Error('Failed to create order'); }
      const orderJson = await orderRes.json();
      const { orderId, amount, currency } = orderJson.data || {};

      const ok = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!ok || !window.Razorpay) { throw new Error('Failed to load Razorpay'); }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'CALISTA',
        description: 'Order Payment',
        order_id: orderId,
        handler: (resp: any) => onSuccess(resp),
        theme: { color: '#ef4444' }
      });
      rzp.on('payment.failed', (resp: any) => onError(resp?.error?.description || 'Payment failed'));
      rzp.open();
    } catch (e: any) {
      onError(e?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={start} disabled={loading} className="px-6 py-3 bg-black text-white rounded-lg font-bold uppercase tracking-wider hover:bg-red-500 transition-colors disabled:opacity-50">
      {loading ? 'Processing…' : `Pay with Razorpay`}
    </button>
  );
}
