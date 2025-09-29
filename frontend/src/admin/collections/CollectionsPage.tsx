import { useEffect, useState } from 'react'
import { useNoIndex } from '../../hooks/useNoIndex'
import { Link, useNavigate } from 'react-router-dom'

const BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'

export default function CollectionsPage() {
  useNoIndex('Store Management')
  const nav = useNavigate()
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState<any>({ name:'', description:'', is_active:true, is_featured:false, sort_order:0, seo_title:'', seo_description:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections`, { credentials: 'include' })
    const json = await res.json(); if (res.ok) setRows(json.data||[])
  }
  useEffect(()=>{ load() },[])

  const create = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const json = await res.json(); if (!res.ok) throw new Error(json?.message||'Create failed')
      setForm({ name:'', description:'', is_active:true, is_featured:false, sort_order:0, seo_title:'', seo_description:'' })
      await load()
    } catch (e:any) { setError(e?.message||'Failed') } finally { setLoading(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this collection?')) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections/${id}`, { method:'DELETE', credentials:'include' })
    if (res.ok) load()
  }

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold mb-4">Collections</h1>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rows.map((c:any)=> (
                <div key={c.id} className="border rounded overflow-hidden">
                  {c.banner_url || c.image_url ? (
                    <img src={c.banner_url||c.image_url} alt={c.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>
                  )}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      {!c.is_active && <div className="text-xs">inactive</div>}
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <Link className="px-2 py-1 border rounded" to={`/${BASE}/collections/${c.id}`}>Open</Link>
                      <button className="px-2 py-1 border rounded" onClick={()=>remove(c.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="border rounded">
              <div className="p-3 border-b font-semibold">Add Collection</div>
              <div className="p-3 grid gap-3">
                <input className="border rounded p-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                <textarea className="border rounded p-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" className="border rounded p-2" placeholder="Sort Order" value={form.sort_order} onChange={e=>setForm({...form, sort_order: Number(e.target.value)})} />
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_active} onChange={e=>setForm({...form, is_active: e.target.checked})} /> Active</label>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_featured} onChange={e=>setForm({...form, is_featured: e.target.checked})} /> Featured</label>
                <input className="border rounded p-2" placeholder="SEO Title" value={form.seo_title} onChange={e=>setForm({...form, seo_title: e.target.value})} />
                <textarea className="border rounded p-2" placeholder="SEO Description" value={form.seo_description} onChange={e=>setForm({...form, seo_description: e.target.value})} />
                <button disabled={loading} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50" onClick={create}>{loading?'Saving…':'Create Collection'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
