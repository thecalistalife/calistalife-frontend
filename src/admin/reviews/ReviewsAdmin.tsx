import { useEffect, useState } from 'react'

const BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'

export default function ReviewsAdmin() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/reviews`, { credentials: 'include' })
      const j = await r.json(); if (!r.ok) throw new Error(j?.message||'Failed')
      setRows(j.data||[])
    } catch (e:any) { setError(e?.message||'Failed to load') } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const approve = async (id: string, isApproved: boolean) => {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/reviews/${id}/approval`, { method:'PATCH', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ isApproved }) })
    if (r.ok) load()
  }
  const remove = async (id: string) => {
    if (!confirm('Delete this review?')) return
    const r = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/reviews/${id}`, { method:'DELETE', credentials: 'include' })
    if (r.ok) load()
  }
  const respond = async (id: string) => {
    const text = prompt('Response text') || ''
    if (!text.trim()) return
    const r = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/reviews/${id}/respond`, { method:'POST', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ responseText: text }) })
    if (r.ok) load()
  }

  return (
    <div className="pt-16 lg:pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold mb-4">Reviews</h1>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Reviewer</th>
                <th className="text-left p-3">Rating</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Approved</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.product_id}</td>
                  <td className="p-3">{r.reviewer_name}<div className="text-xs text-gray-600">{r.reviewer_email}</div></td>
                  <td className="p-3">{r.rating}</td>
                  <td className="p-3">{r.review_title}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{r.is_approved? 'Yes':'No'}</td>
                  <td className="p-3 text-right">
                    <button className="px-2 py-1 border rounded mr-2" onClick={()=>approve(r.id, !r.is_approved)}>{r.is_approved?'Hide':'Approve'}</button>
                    <button className="px-2 py-1 border rounded mr-2" onClick={()=>respond(r.id)}>Respond</button>
                    <button className="px-2 py-1 border rounded text-red-600" onClick={()=>remove(r.id)}>Delete</button>
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
