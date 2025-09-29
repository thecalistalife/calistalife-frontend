import { useEffect, useState } from 'react';
import { AdminAPI } from '../../lib/api';

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await AdminAPI.ordersList();
        setOrders(res.data.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load orders');
      } finally { setLoading(false); }
    };
    run();
  }, []);

  const updateStatus = async (id: string, updates: any) => {
    try {
      const res = await AdminAPI.orderUpdate(id, updates);
      setOrders((prev) => prev.map((o) => o.id === id ? res.data.data : o));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left border">Order #</th>
              <th className="p-3 text-left border">Customer</th>
              <th className="p-3 text-left border">Total</th>
              <th className="p-3 text-left border">Status</th>
              <th className="p-3 text-left border">Tracking</th>
              <th className="p-3 text-left border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 border">{o.order_number}</td>
                <td className="p-3 border">{o.shipping_address?.name || o.billing_address?.name || o.customer_email || '-'}</td>
                <td className="p-3 border">₹{(o.total_amount || 0).toFixed(2)}</td>
                <td className="p-3 border">
                  <select
                    defaultValue={o.order_status}
                    onChange={(e) => updateStatus(o.id, { order_status: e.target.value })}
                    className="border p-2 rounded"
                  >
                    {['confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3 border">
                  <div className="flex gap-2">
                    <input defaultValue={o.tracking_number || ''} placeholder="Tracking #" className="border p-2 rounded w-36" onBlur={(e)=>updateStatus(o.id,{ tracking_number: e.target.value })}/>
                    <input defaultValue={o.courier || ''} placeholder="Courier" className="border p-2 rounded w-28" onBlur={(e)=>updateStatus(o.id,{ courier: e.target.value })}/>
                    <input defaultValue={o.track_url || ''} placeholder="Track URL" className="border p-2 rounded w-64" onBlur={(e)=>updateStatus(o.id,{ track_url: e.target.value })}/>
                  </div>
                </td>
                <td className="p-3 border text-sm">
                  <button className="px-3 py-2 bg-black text-white rounded mr-2" onClick={()=>updateStatus(o.id,{ order_status: 'shipped' })}>Mark Shipped</button>
                  <button className="px-3 py-2 bg-gray-800 text-white rounded mr-2" onClick={()=>updateStatus(o.id,{ order_status: 'out_for_delivery' })}>Out for Delivery</button>
                  <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={()=>updateStatus(o.id,{ order_status: 'delivered' })}>Delivered</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
