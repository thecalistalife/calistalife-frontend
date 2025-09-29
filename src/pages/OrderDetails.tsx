import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OrdersAPI } from '../lib/api';
import { formatPrice } from '../utils';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const res = await OrdersAPI.get(id);
        setOrder(res.data.data || null);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/orders" className="text-sm text-blue-600 hover:underline">Back to orders</Link>
        </div>
        {loading && <div>Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {order && (
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
              <div className="mt-2 text-sm text-gray-600">Placed on {new Date(order.created_at).toLocaleString()}</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="font-semibold">Payment</div>
                  <div className="capitalize">{order.payment_method} — {order.payment_status}</div>
                </div>
                <div>
                  <div className="font-semibold">Order Status</div>
                  <div className="capitalize">{order.order_status}</div>
                </div>
                <div>
                  <div className="font-semibold">Total</div>
                  <div>{formatPrice(Number(order.total_amount || 0))}</div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Tracking</h2>
              <div className="text-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-semibold">Courier</div>
                  <div>{order.courier || '-'}</div>
                </div>
                <div>
                  <div className="font-semibold">Tracking #</div>
                  <div>{order.tracking_number || '-'}</div>
                </div>
                <div>
                  <div className="font-semibold">Track</div>
                  {order.track_url ? <a href={order.track_url} target="_blank" className="text-blue-600 underline">Track package</a> : <span>-</span>}
                </div>
              </div>
              {order.estimated_delivery && (
                <div className="mt-3 text-sm text-gray-700">Estimated delivery: <b>{new Date(order.estimated_delivery).toLocaleDateString()}</b></div>
              )}
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Items</h2>
              <div className="divide-y">
                {(order.order_items || []).map((it: any) => (
                  <div key={it.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-gray-600">{it.size} / {it.color} — Qty {it.quantity}</div>
                    </div>
                    <div>{formatPrice(Number(it.total || 0))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
