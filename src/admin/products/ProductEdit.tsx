import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNoIndex } from '../../hooks/useNoIndex'
import ImageUploader from '../images/ImageUploader'
import VariantMatrix from '../variants/VariantMatrix'

const BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'
const API = (path: string, init?: RequestInit) => fetch(`${import.meta.env.VITE_API_URL}/${BASE}${path}`, { credentials: 'include', ...(init||{}) })

export default function ProductEdit() {
  useNoIndex('Store Management')
  const nav = useNavigate()
  const { id } = useParams()
  const isNew = id === 'new'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ name: '', price: 0, status: 'active', stockQuantity: 0, images: [] as string[] })
  const [images, setImages] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      if (!id || id === 'new') return
      const res = await API(`/products/${id}`)
      const json = await res.json()
      if (res.ok) setForm(json.data)
      const ir = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/media/list?productId=${encodeURIComponent(id)}`, { credentials: 'include' })
      const ij = await ir.json()
      if (ir.ok) setImages(ij.data||[])
    }
    run()
  }, [id])

  const save = async () => {
    setLoading(true); setError(null)
    try {
      const init: RequestInit = { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }
      const res = await API(isNew ? '/products' : `/products/${id}`, init)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Save failed')
      nav(`/${BASE}/products`)
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{isNew ? 'Add Product' : 'Edit Product'}</h1>
          <div className="flex gap-2">
            <button onClick={()=>nav(`/${BASE}/products`)} className="px-4 py-2 border rounded">Cancel</button>
            <button disabled={loading} onClick={save} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <div className="grid gap-4">
          <input className="border rounded p-3" placeholder="Name" value={form.name||''} onChange={e=>setForm({ ...form, name: e.target.value })} />
          <textarea className="border rounded p-3" placeholder="Description" value={form.description||''} onChange={e=>setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded p-3" placeholder="Price" type="number" value={form.price||0} onChange={e=>setForm({ ...form, price: Number(e.target.value) })} />
            <input className="border rounded p-3" placeholder="Original Price" type="number" value={form.originalPrice||0} onChange={e=>setForm({ ...form, originalPrice: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded p-3" placeholder="SKU" value={form.sku||''} onChange={e=>setForm({ ...form, sku: e.target.value })} />
            <select className="border rounded p-3" value={form.status||'active'} onChange={e=>setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input className="border rounded p-3" placeholder="Stock Quantity" type="number" value={form.stockQuantity||0} onChange={e=>setForm({ ...form, stockQuantity: Number(e.target.value) })} />
            <input className="border rounded p-3" placeholder="Category" value={form.category||''} onChange={e=>setForm({ ...form, category: e.target.value })} />
          </div>
          <input className="border rounded p-3" placeholder="Collection" value={form.collection||''} onChange={e=>setForm({ ...form, collection: e.target.value })} />
          <input className="border rounded p-3" placeholder="Image URL (comma-separated)" value={(form.images||[]).join(',')} onChange={e=>setForm({ ...form, images: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) })} />
          <input className="border rounded p-3" placeholder="Tags (comma-separated)" value={(form.tags||[]).join(',')} onChange={e=>setForm({ ...form, tags: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) })} />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isFeatured} onChange={e=>setForm({ ...form, isFeatured: e.target.checked })}/> Featured</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isNew} onChange={e=>setForm({ ...form, isNew: e.target.checked })}/> New</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isOnSale} onChange={e=>setForm({ ...form, isOnSale: e.target.checked })}/> On Sale</label>
          </div>

          {/* Images */}
          {!isNew && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-3">Images</h2>
              <ImageUploader base={BASE} productId={id!} onUploaded={(img)=> setImages(prev=>[...prev, img])} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {images.map((im:any)=>(
                  <div key={im.id} className="border rounded p-2">
                    <img src={im.meta?.thumbUrl || im.url} alt={im.alt||''} className="w-full h-32 object-cover rounded" />
                    <input className="mt-2 w-full border rounded p-1 text-sm" placeholder="Alt text" value={im.alt||''} onChange={async (e)=>{
                      const val = e.target.value
                      setImages(prev=>prev.map((x:any)=> x.id===im.id?{...x,alt:val}:x))
                      await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/media/${im.id}`, { method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ alt: val }) })
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants */}
          {!isNew && (
            <VariantMatrix base={BASE} productId={id!} />
          )}
        </div>
      </div>
    </div>
  )
}
