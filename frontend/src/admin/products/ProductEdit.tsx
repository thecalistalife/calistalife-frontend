import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useNoIndex } from '../../hooks/useNoIndex'
import ImageUploader from '../images/ImageUploader'
import VariantMatrix from '../variants/VariantMatrix'

const BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'
const API = (path: string, init?: RequestInit) => fetch(`${import.meta.env.VITE_API_URL}/${BASE}${path}`, { credentials: 'include', ...(init||{}) })

function Organization({ productId }: { productId: string }) {
  const BASE = (import.meta as any).env?.VITE_ADMIN_BASE_PATH || 'cl-private-dashboard-2024'
  const [cats, setCats] = useState<any[]>([])
  const [cols, setCols] = useState<any[]>([])
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedCols, setSelectedCols] = useState<string[]>([])

  useEffect(()=>{
    const run = async () => {
      const cr = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/categories`, { credentials: 'include' })
      const cj = await cr.json();
      const flat = (function listify(nodes:any[], acc:any[]=[], depth=0): any[]{ for(const n of (nodes||[])){ acc.push({id:n.id,name:n.name,depth}); if(n.children?.length) listify(n.children,acc,depth+1);} return acc })(cj.data||[])
      setCats(flat)
      const lr = await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections`, { credentials: 'include' })
      const lj = await lr.json(); setCols(lj.data||[])
    }
    run()
  },[])

  const save = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/categories/assign`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId, categoryIds: selectedCats }) })
    await fetch(`${import.meta.env.VITE_API_URL}/${BASE}/collections/assign`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId, collectionIds: selectedCols }) })
    alert('Organization saved')
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-3">Organization</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="font-semibold mb-2">Categories</div>
          <div className="border rounded max-h-64 overflow-auto">
            {cats.map(c=> (
              <label key={c.id} className="flex items-center gap-2 px-3 py-2 border-b text-sm">
                <input type="checkbox" checked={selectedCats.includes(c.id)} onChange={e=> setSelectedCats(p=> e.target.checked ? [...p,c.id] : p.filter(x=>x!==c.id))} />
                <span style={{ paddingLeft: c.depth*12 }}>{c.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Collections</div>
          <div className="border rounded max-h-64 overflow-auto">
            {cols.map((c:any)=> (
              <label key={c.id} className="flex items-center gap-2 px-3 py-2 border-b text-sm">
                <input type="checkbox" checked={selectedCols.includes(c.id)} onChange={e=> setSelectedCols(p=> e.target.checked ? [...p,c.id] : p.filter(x=>x!==c.id))} />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <button className="px-4 py-2 border rounded" onClick={save}>Save Organization</button>
      </div>
    </div>
  )
}

export default function ProductEdit() {
  useNoIndex('Store Management')
  const nav = useNavigate()
  const { id } = useParams()
  const isNew = id === 'new'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ 
    name: '', price: 0, status: 'active', stockQuantity: 0, images: [] as string[],
    // Quality-focused fields
    fabricComposition: {},
    threadCount: 0,
    fabricWeight: 0,
    durabilityScore: 5,
    stretchLevel: '',
    careInstructions: [],
    qualityGrade: 'standard',
    sustainabilityRating: 'B',
    breathabilityRating: 3,
    fabricOrigin: '',
    manufacturingLocation: '',
    certifications: [],
    fitType: 'regular',
    seasonalCollection: '',
    lifestyleTags: [],
    recommendedFor: []
  })
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

          {/* Quality-Focused Section */}
          <div className="mt-8 p-4 border rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Quality Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className="border rounded p-3" value={form.qualityGrade||'standard'} onChange={e=>setForm({ ...form, qualityGrade: e.target.value })}>
                <option value="basic">Basic Quality</option>
                <option value="standard">Standard Quality</option>
                <option value="premium">Premium Quality</option>
              </select>
              
              <select className="border rounded p-3" value={form.sustainabilityRating||'B'} onChange={e=>setForm({ ...form, sustainabilityRating: e.target.value })}>
                <option value="A+">A+ Sustainability</option>
                <option value="A">A Sustainability</option>
                <option value="B+">B+ Sustainability</option>
                <option value="B">B Sustainability</option>
                <option value="C+">C+ Sustainability</option>
                <option value="C">C Sustainability</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <input className="border rounded p-3" placeholder="Thread Count" type="number" value={form.threadCount||0} onChange={e=>setForm({ ...form, threadCount: Number(e.target.value) })} />
              <input className="border rounded p-3" placeholder="Fabric Weight (oz/yd²)" type="number" step="0.1" value={form.fabricWeight||0} onChange={e=>setForm({ ...form, fabricWeight: Number(e.target.value) })} />
              <input className="border rounded p-3" placeholder="Durability (1-10)" type="number" min="1" max="10" value={form.durabilityScore||5} onChange={e=>setForm({ ...form, durabilityScore: Number(e.target.value) })} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <select className="border rounded p-3" value={form.stretchLevel||''} onChange={e=>setForm({ ...form, stretchLevel: e.target.value })}>
                <option value="">Select Stretch Level</option>
                <option value="none">No Stretch</option>
                <option value="low">Low Stretch</option>
                <option value="medium">Medium Stretch</option>
                <option value="high">High Stretch</option>
                <option value="four-way">Four-Way Stretch</option>
              </select>
              
              <input className="border rounded p-3" placeholder="Breathability (1-5)" type="number" min="1" max="5" value={form.breathabilityRating||3} onChange={e=>setForm({ ...form, breathabilityRating: Number(e.target.value) })} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <select className="border rounded p-3" value={form.fitType||'regular'} onChange={e=>setForm({ ...form, fitType: e.target.value })}>
                <option value="slim">Slim Fit</option>
                <option value="regular">Regular Fit</option>
                <option value="relaxed">Relaxed Fit</option>
                <option value="oversized">Oversized Fit</option>
              </select>
              
              <input className="border rounded p-3" placeholder="Seasonal Collection" value={form.seasonalCollection||''} onChange={e=>setForm({ ...form, seasonalCollection: e.target.value })} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <input className="border rounded p-3" placeholder="Fabric Origin" value={form.fabricOrigin||''} onChange={e=>setForm({ ...form, fabricOrigin: e.target.value })} />
              <input className="border rounded p-3" placeholder="Manufacturing Location" value={form.manufacturingLocation||''} onChange={e=>setForm({ ...form, manufacturingLocation: e.target.value })} />
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <textarea className="border rounded p-3" placeholder="Care Instructions (JSON format: [\"Machine wash cold\", \"Tumble dry low\"])" value={JSON.stringify(form.careInstructions||[])} onChange={e=>{ try { setForm({ ...form, careInstructions: JSON.parse(e.target.value) }); } catch {} }} />
              <textarea className="border rounded p-3" placeholder="Certifications (JSON format: [\"GOTS\", \"OEKO-TEX\"])" value={JSON.stringify(form.certifications||[])} onChange={e=>{ try { setForm({ ...form, certifications: JSON.parse(e.target.value) }); } catch {} }} />
              <textarea className="border rounded p-3" placeholder="Lifestyle Tags (JSON format: [\"casual\", \"work\", \"weekend\"])" value={JSON.stringify(form.lifestyleTags||[])} onChange={e=>{ try { setForm({ ...form, lifestyleTags: JSON.parse(e.target.value) }); } catch {} }} />
              <textarea className="border rounded p-3" placeholder="Recommended For (JSON format: [\"office\", \"date night\", \"casual outings\"])" value={JSON.stringify(form.recommendedFor||[])} onChange={e=>{ try { setForm({ ...form, recommendedFor: JSON.parse(e.target.value) }); } catch {} }} />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Fabric Composition</label>
              <textarea className="border rounded p-3 w-full" placeholder="Fabric Composition (JSON format: {\"cotton\": 60, \"polyester\": 40})" rows={3} value={JSON.stringify(form.fabricComposition||{})} onChange={e=>{ try { setForm({ ...form, fabricComposition: JSON.parse(e.target.value) }); } catch {} }} />
            </div>
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

          {/* Organization */}
          {!isNew && (
            <Organization productId={id!} />
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
