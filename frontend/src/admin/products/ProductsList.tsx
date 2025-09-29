import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoIndex } from '../../hooks/useNoIndex'

const API = (path: string, init?: RequestInit) => fetch(`${import.meta.env.VITE_API_URL}/${(import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'}${path}`, { credentials: 'include', ...(init||{}) })

export default function ProductsList() {
  useNoIndex('Store Management')
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await API(`/products?q=${encodeURIComponent(q)}&sort=createdAt_desc&limit=50`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Failed')
      setRows(json.data || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    const res = await API(`/products/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex gap-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="border rounded p-2" />
            <button onClick={load} className="px-4 py-2 border rounded">Search</button>
            <button onClick={()=>nav(`/${(import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'}/products/new`)} className="px-4 py-2 bg-black text-white rounded">Add Product</button>
          </div>
        </div>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Stock</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-600">{p.slug}</div>
                  </td>
                  <td className="p-3">₹{Number(p.price).toFixed(2)}</td>
                  <td className="p-3 capitalize">{p.status || 'active'}</td>
                  <td className="p-3">{p.stockQuantity ?? 0}</td>
                  <td className="p-3 text-right">
                    <button onClick={()=>nav(`/${(import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'}/products/${p.id}`)} className="px-3 py-1 border rounded mr-2">Edit</button>
                    <button onClick={()=>onDelete(p.id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
