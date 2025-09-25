import { useEffect, useState } from 'react'
import { useNoIndex } from '../../hooks/useNoIndex'

const sizes = ['XS','S','M','L','XL','XXL','3XL']
const materials = ['Cotton','Polyester','Blend','Denim']

export default function VariantMatrix({ productId, base }: { productId: string; base: string }) {
  useNoIndex()
  const [rows, setRows] = useState<any[]>([])
  const [sizeSet, setSizeSet] = useState<string[]>([])
  const [color, setColor] = useState('Black')
  const [material, setMaterial] = useState('Cotton')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${base}/variants?productId=${encodeURIComponent(productId)}`, { credentials: 'include' })
    const json = await res.json()
    if (res.ok) setRows(json.data||[])
  }
  useEffect(()=>{ load() },[])

  const addVariants = () => {
    const newRows = sizeSet.map(s => ({ id: undefined, size: s, color, material, sku: '', stock_quantity: 0, price_adjustment: 0 }))
    setRows(prev => [...prev, ...newRows])
  }

  const save = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/${base}/variants/upsert`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variants: rows })
      })
      if (!res.ok) throw new Error('Save failed')
      await load()
    } catch (e:any) { setError(e?.message||'Failed') } finally { setLoading(false) }
  }

  const remove = (idx: number) => {
    setRows(prev => prev.filter((_,i)=>i!==idx))
  }

  const update = (idx: number, patch: any) => {
    setRows(prev => prev.map((r,i)=> i===idx ? { ...r, ...patch } : r))
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-3">Variants</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <div className="flex gap-2 mb-4 items-center">
        <div className="flex gap-1 flex-wrap">
          {sizes.map(s => (
            <label key={s} className={`px-3 py-1 border rounded cursor-pointer ${sizeSet.includes(s)?'bg-black text-white':'bg-white'}`}>
              <input type="checkbox" className="hidden" checked={sizeSet.includes(s)} onChange={(e)=>{
                setSizeSet(prev => e.target.checked ? [...prev, s] : prev.filter(x=>x!==s))
              }} />{s}
            </label>
          ))}
        </div>
        <input className="border rounded p-2" placeholder="Color" value={color} onChange={e=>setColor(e.target.value)} />
        <select className="border rounded p-2" value={material} onChange={e=>setMaterial(e.target.value)}>
          {materials.map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
        <button className="px-4 py-2 border rounded" onClick={addVariants}>Add</button>
        <button className="px-4 py-2 bg-black text-white rounded disabled:opacity-50" disabled={loading} onClick={save}>{loading?'Saving…':'Save Variants'}</button>
      </div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Size</th>
              <th className="text-left p-3">Color</th>
              <th className="text-left p-3">Material</th>
              <th className="text-left p-3">SKU</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">+Price</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,idx)=>(
              <tr key={idx} className="border-t">
                <td className="p-3"><input className="border rounded p-1 w-24" value={r.size||''} onChange={e=>update(idx,{size:e.target.value})} /></td>
                <td className="p-3"><input className="border rounded p-1 w-24" value={r.color||''} onChange={e=>update(idx,{color:e.target.value})} /></td>
                <td className="p-3"><input className="border rounded p-1 w-28" value={r.material||''} onChange={e=>update(idx,{material:e.target.value})} /></td>
                <td className="p-3"><input className="border rounded p-1 w-32" value={r.sku||''} onChange={e=>update(idx,{sku:e.target.value})} /></td>
                <td className="p-3"><input type="number" className="border rounded p-1 w-20" value={r.stock_quantity||0} onChange={e=>update(idx,{stock_quantity:Number(e.target.value)})} /></td>
                <td className="p-3"><input type="number" className="border rounded p-1 w-24" value={r.price_adjustment||0} onChange={e=>update(idx,{price_adjustment:Number(e.target.value)})} /></td>
                <td className="p-3 text-right"><button className="px-3 py-1 border rounded text-red-600" onClick={()=>remove(idx)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
