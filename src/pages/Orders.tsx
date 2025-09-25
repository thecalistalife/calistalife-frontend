import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OrdersAPI } from '../lib/api';
import { formatPrice } from '../utils';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await OrdersAPI.my();
        setOrders(res.data.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        {loading && <div>Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Order #</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-left p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3 font-mono">{o.order_number}</td>
                    <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="p-3">{formatPrice(Number(o.total_amount || 0))}</td>
                    <td className="p-3 capitalize">{o.payment_status || 'pending'}</td>
                    <td className="p-3 capitalize">{o.order_status || 'processing'}</td>
                    <td className="p-3">
                      <Link className="text-blue-600 hover:underline" to={`/orders/${o.id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}