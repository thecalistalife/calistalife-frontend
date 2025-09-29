import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNoIndex } from '../../hooks/useNoIndex'

const BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'

export default function CollectionEditPage() {
  useNoIndex('Store Management')
  const { id } = useParams()
  const [col, setCol] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState<any[]>([])

  const load = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections/${id}`, { credentials: 'include' })
    const json = await res.json(); if (res.ok) setCol(json.data)
  }
  useEffect(()=>{ if (id) load() }, [id])

  const save = async () => {
    setLoading(true); setError(null)
    try {
      const body = { ...col }; delete body.products
      const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections/${id}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Save failed')
      await load()
    } catch (e:any) { setError(e?.message||'Failed') } finally { setLoading(false) }
  }

  const addProducts = async (productIds: string[]) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections/${id}/products`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productIds }) })
    if (res.ok) load()
  }

  const remove = async (pid: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections/${id}/products/${pid}`, { method:'DELETE', credentials:'include' })
    if (res.ok) load()
  }

  const runSearch = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products?search=${encodeURIComponent(q)}&limit=10`)
    const json = await res.json(); if (res.ok) setSearch(json.data||[])
  }

  if (!col) return <div className="pt-16 lg:pt-20 container mx-auto px-4 sm:px-6 lg:px-8 py-12">Loading…</div>

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Collection</h1>
          <button className="px-4 py-2 bg-black text-white rounded disabled:opacity-50" onClick={save} disabled={loading}>{loading?'Saving…':'Save'}</button>
        </div>
        {error && <div className="text-red-600 mb-3">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="grid gap-3">
            <input className="border rounded p-2" placeholder="Name" value={col.name||''} onChange={e=>setCol({...col, name:e.target.value})} />
            <input className="border rounded p-2" placeholder="Slug" value={col.slug||''} onChange={e=>setCol({...col, slug:e.target.value})} />
            <textarea className="border rounded p-2" placeholder="Description" value={col.description||''} onChange={e=>setCol({...col, description:e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!col.is_active} onChange={e=>setCol({...col, is_active:e.target.checked})} /> Active</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!col.is_featured} onChange={e=>setCol({...col, is_featured:e.target.checked})} /> Featured</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded p-2" placeholder="SEO Title" value={col.seo_title||''} onChange={e=>setCol({...col, seo_title:e.target.value})} />
              <input className="border rounded p-2" placeholder="Sort Order" type="number" value={col.sort_order||0} onChange={e=>setCol({...col, sort_order:Number(e.target.value)})} />
            </div>
            <textarea className="border rounded p-2" placeholder="SEO Description" value={col.seo_description||''} onChange={e=>setCol({...col, seo_description:e.target.value})} />
          </div>

          <div>
            <div className="border rounded">
              <div className="p-3 border-b font-semibold">Products</div>
              <div className="p-3">
                <div className="flex gap-2 mb-3">
                  <input className="border rounded p-2 flex-1" placeholder="Search products" value={q} onChange={e=>setQ(e.target.value)} />
                  <button className="px-4 py-2 border rounded" onClick={runSearch}>Search</button>
                </div>
                {search.length>0 && (
                  <div className="mb-4 border rounded">
                    {search.map(p=> (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b">
                        <div className="text-sm">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-600">₹{Number(p.price).toFixed(2)}</div>
                        </div>
                        <button className="px-2 py-1 border rounded" onClick={()=>addProducts([p.id])}>Add</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border rounded">
                  {(col.products||[]).map((m:any)=> (
                    <div key={m.product_id} className="flex items-center justify-between px-3 py-2 border-b">
                      <div className="text-sm font-medium">{m.product_id}</div>
                      <button className="px-2 py-1 border rounded" onClick={()=>remove(m.product_id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
