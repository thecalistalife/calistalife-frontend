import { useEffect, useMemo, useState } from 'react'
import { ReviewsAPI } from '../../lib/api'
import { useAuthStore } from '../../store/auth'

export default function ProductReviews({ productId }: { productId: string }) {
  const user = useAuthStore(s => s.user as any)
  const [summary, setSummary] = useState<{ total: number; average: number; counts: Record<number, number>; verified: number } | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sort, setSort] = useState<'newest'|'helpful'>('newest')
  const [filters, setFilters] = useState<{ photosOnly?: boolean; verifiedOnly?: boolean; minRating?: number; fit?: 'too_small'|'perfect'|'too_large' }>({})

  const [form, setForm] = useState<any>({ rating: 5, reviewTitle: '', reviewText: '', reviewerName: user?.name || '', reviewerEmail: user?.email || '', sizePurchased: '', colorPurchased: '', fitFeedback: '', qualityRating: 5, comfortRating: 5, styleRating: 5 })
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = async () => {
    const r = await ReviewsAPI.summary(productId)
    if (r.data?.success) setSummary(r.data.data as any)
  }
  const loadList = async () => {
    const r = await ReviewsAPI.list(productId, { page, limit, sort, ...filters })
    if (r.data?.success) setRows(r.data.data as any[])
  }
  useEffect(()=>{ loadSummary(); /* eslint-disable-next-line */ },[productId])
  useEffect(()=>{ loadList(); /* eslint-disable-next-line */ },[productId, page, limit, sort, JSON.stringify(filters)])

  const onSubmit = async () => {
    setSubmitting(true); setError(null)
    try {
      let uploaded: string[] = []
      if (images.length) {
        const ur = await ReviewsAPI.uploadImages(images)
        uploaded = ur.data?.data?.urls || []
      }
      const payload = { ...form, productId, imageUrls: uploaded }
      const cr = await ReviewsAPI.create(payload)
      if (!cr.data?.success) throw new Error(cr.data?.message||'Failed')
      // attach uploaded urls as review_images records via a quick fire-and-forget call to backend is not in scope here
      setForm({ rating: 5, reviewTitle: '', reviewText: '', reviewerName: user?.name || '', reviewerEmail: user?.email || '', sizePurchased: '', colorPurchased: '', fitFeedback: '', qualityRating: 5, comfortRating: 5, styleRating: 5 })
      setImages([])
      await Promise.all([loadSummary(), loadList()])
      alert('Thanks for your review!')
    } catch (e:any) {
      setError(e?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const onVote = async (id: string, helpful: boolean) => {
    try {
      const r = await ReviewsAPI.vote(id, helpful)
      if (r.data?.success) {
        setRows(prev => prev.map(x => x.id===id? { ...x, helpful_count: r.data.data.helpful, unhelpful_count: r.data.data.unhelpful } : x))
      }
    } catch {}
  }

  return (
    <section className="mt-12">
      <div className="border-b pb-4 mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <div className="text-sm text-gray-600">{summary?.average || 0} / 5 • {summary?.total || 0} reviews</div>
        </div>
        <div className="flex gap-2 items-center">
          <select className="border rounded p-2" value={sort} onChange={e=>setSort(e.target.value as any)}>
            <option value="newest">Newest</option>
            <option value="helpful">Most Helpful</option>
          </select>
          <select className="border rounded p-2" value={String(filters.minRating||'')} onChange={e=>setFilters(p=>({...p, minRating: e.target.value? Number(e.target.value): undefined}))}>
            <option value="">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4+ stars</option>
            <option value="3">3+ stars</option>
            <option value="2">2+ stars</option>
            <option value="1">1+ stars</option>
          </select>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!filters.verifiedOnly} onChange={e=>setFilters(p=>({ ...p, verifiedOnly: e.target.checked||undefined }))}/> Verified only</label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={!!filters.photosOnly} onChange={e=>setFilters(p=>({ ...p, photosOnly: e.target.checked||undefined }))}/> With photos</label>
        </div>
      </div>

      {/* Review form */}
      <div className="border rounded p-4 mb-8">
        <h3 className="font-semibold mb-3">Write a review</h3>
        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border rounded p-2" placeholder="Your name" value={form.reviewerName} onChange={e=>setForm({ ...form, reviewerName: e.target.value })} />
          <input className="border rounded p-2" placeholder="Your email" value={form.reviewerEmail} onChange={e=>setForm({ ...form, reviewerEmail: e.target.value })} />
          <select className="border rounded p-2" value={form.rating} onChange={e=>setForm({ ...form, rating: Number(e.target.value) })}>
            {[5,4,3,2,1].map(n=> <option key={n} value={n}>{n} stars</option>)}
          </select>
          <input className="border rounded p-2" placeholder="Review title (optional)" value={form.reviewTitle} onChange={e=>setForm({ ...form, reviewTitle: e.target.value })} />
          <textarea className="border rounded p-2 md:col-span-2" placeholder="Share details about fit, quality, and your experience" value={form.reviewText} onChange={e=>setForm({ ...form, reviewText: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <input className="border rounded p-2" placeholder="Size purchased" value={form.sizePurchased} onChange={e=>setForm({ ...form, sizePurchased: e.target.value })} />
            <input className="border rounded p-2" placeholder="Color purchased" value={form.colorPurchased} onChange={e=>setForm({ ...form, colorPurchased: e.target.value })} />
            <select className="border rounded p-2" value={form.fitFeedback} onChange={e=>setForm({ ...form, fitFeedback: e.target.value })}>
              <option value="">Fit feedback</option>
              <option value="too_small">Too small</option>
              <option value="perfect">Perfect</option>
              <option value="too_large">Too large</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select className="border rounded p-2" value={form.qualityRating} onChange={e=>setForm({ ...form, qualityRating: Number(e.target.value) })}>
              {[5,4,3,2,1].map(n=> <option key={n} value={n}>Quality: {n}</option>)}
            </select>
            <select className="border rounded p-2" value={form.comfortRating} onChange={e=>setForm({ ...form, comfortRating: Number(e.target.value) })}>
              {[5,4,3,2,1].map(n=> <option key={n} value={n}>Comfort: {n}</option>)}
            </select>
            <select className="border rounded p-2" value={form.styleRating} onChange={e=>setForm({ ...form, styleRating: Number(e.target.value) })}>
              {[5,4,3,2,1].map(n=> <option key={n} value={n}>Style: {n}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <input type="file" multiple accept="image/*" onChange={e=> setImages(Array.from(e.target.files||[]).slice(0,4))} />
            {images.length>0 && <div className="text-xs text-gray-600 mt-1">{images.length} image(s) selected</div>}
          </div>
        </div>
        <div className="mt-3">
          <button className="px-4 py-2 bg-black text-white rounded disabled:opacity-50" disabled={submitting} onClick={onSubmit}>{submitting?'Submitting…':'Submit review'}</button>
        </div>
      </div>

      {/* Review list */}
      <div className="grid gap-4">
        {rows.map(r=> (
          <div key={r.id} className="border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{r.reviewer_name} {r.verified_purchase && <span className="text-xs ml-2 px-2 py-0.5 border rounded">Verified</span>}</div>
              <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleDateString()}</div>
            </div>
            <div className="text-yellow-600 text-sm mb-1">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            {r.review_title && <div className="font-medium mb-1">{r.review_title}</div>}
            <div className="text-gray-800 mb-2 whitespace-pre-wrap">{r.review_text}</div>
            {(r.images||[]).length>0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {r.images.map((im:any)=> (
                  <img key={im.id} src={im.image_url} alt={im.image_alt||''} className="w-full h-28 object-cover rounded" />
                ))}
              </div>
            )}
            {(r.responses||[]).length>0 && (
              <div className="bg-gray-50 border rounded p-3 text-sm">
                {r.responses.map((rp:any)=> (
                  <div key={rp.id} className="mb-2"><span className="font-semibold">{rp.responder_name}:</span> {rp.response_text}</div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-3 text-sm">
              <button className="px-3 py-1 border rounded" onClick={()=>onVote(r.id, true)}>Helpful ({r.helpful_count||0})</button>
              <button className="px-3 py-1 border rounded" onClick={()=>onVote(r.id, false)}>Not helpful ({r.unhelpful_count||0})</button>
            </div>
          </div>
        ))}
      </div>

      {rows.length===0 && <div className="text-gray-600">No reviews yet. Be the first to review.</div>}

      <div className="flex items-center gap-2 mt-6">
        <button className="px-3 py-1 border rounded" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button>
        <div className="text-sm">Page {page}</div>
        <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </section>
  )
}
