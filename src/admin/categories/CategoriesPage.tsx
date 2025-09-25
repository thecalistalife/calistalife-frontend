import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNoIndex } from '../../hooks/useNoIndex'

const BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'

export default function CategoriesPage() {
  useNoIndex('Store Management')
  const [tree, setTree] = useState<any[]>([])
  const [flat, setFlat] = useState<any[]>([])
  const [form, setForm] = useState<any>({ name: '', parent_id: '', description: '', is_active: true, sort_order: 0, seo_title:'', seo_description:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/categories`, { credentials: 'include' })
    const json = await res.json()
    if (res.ok) { setTree(json.data||[]); setFlat(listify(json.data||[])) }
  }
  useEffect(()=>{ load() },[])

  function listify(nodes: any[], depth=0, acc: any[]=[]): any[] {
    for (const n of nodes) { acc.push({ ...n, depth }); if (n.children?.length) listify(n.children, depth+1, acc) }
    return acc
  }

  const create = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/categories`, { method: 'POST', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const json = await res.json(); if (!res.ok) throw new Error(json?.message||'Create failed')
      setForm({ name:'', parent_id:'', description:'', is_active:true, sort_order:0, seo_title:'', seo_description:'' })
      await load()
    } catch (e:any) { setError(e?.message||'Failed') } finally { setLoading(false) }
  }

  const updateOrder = async () => {
    const orders = flat.map((c:any, idx:number)=> ({ id: c.id, sort_order: idx+1 }))
    await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/categories/reorder`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orders }) })
    await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/categories/${id}`, { method:'DELETE', credentials:'include' })
    if (res.ok) load()
  }

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold mb-4">Categories</h1>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="border rounded">
              <div className="p-3 border-b font-semibold">Hierarchy</div>
              <div className="max-h-[520px] overflow-y-auto">
                {flat.map((c:any)=> (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <div style={{ width: c.depth*16 }}></div>
                      <div className="font-medium">{c.name}</div>
                      {!c.is_active && <span className="text-xs px-2 py-0.5 border rounded">inactive</span>}
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <button className="px-2 py-1 border rounded" onClick={()=>remove(c.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3">
                <button className="px-4 py-2 border rounded" onClick={updateOrder}>Save Order</button>
              </div>
            </div>
          </div>

          <div>
            <div className="border rounded">
              <div className="p-3 border-b font-semibold">Add Category</div>
              <div className="p-3 grid gap-3">
                <input className="border rounded p-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                <textarea className="border rounded p-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                <select className="border rounded p-2" value={form.parent_id} onChange={e=>setForm({...form, parent_id: e.target.value})}>
                  <option value="">No parent</option>
                  {flat.map((c:any)=> <option key={c.id} value={c.id}>{'— '.repeat(c.depth)}{c.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" className="border rounded p-2" placeholder="Sort Order" value={form.sort_order} onChange={e=>setForm({...form, sort_order: Number(e.target.value)})} />
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.is_active} onChange={e=>setForm({...form, is_active: e.target.checked})} /> Active</label>
                </div>
                <input className="border rounded p-2" placeholder="SEO Title" value={form.seo_title} onChange={e=>setForm({...form, seo_title: e.target.value})} />
                <textarea className="border rounded p-2" placeholder="SEO Description" value={form.seo_description} onChange={e=>setForm({...form, seo_description: e.target.value})} />
                <button disabled={loading} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50" onClick={create}>{loading?'Saving…':'Create Category'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
