import { useEffect, useRef, useState } from 'react'
import { useNoIndex } from '../../hooks/useNoIndex'

export default function ImageUploader({ productId, onUploaded, base }: { productId: string; onUploaded: (img: any)=>void; base: string }) {
  useNoIndex()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (let i=0; i<files.length; i++) {
        const fd = new FormData()
        fd.append('file', files[i])
        fd.append('productId', productId)
        const res = await fetch(`${import.meta.env.VITE_API_URL}/${base}/media/upload`, { method: 'POST', body: fd, credentials: 'include' })
        const json = await res.json()
        if (res.ok) onUploaded(json.data)
      }
    } finally {
      setUploading(false)
      setDragOver(false)
    }
  }

  return (
    <div>
      <div
        onDragOver={(e)=>{e.preventDefault(); setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={(e)=>{e.preventDefault(); handleFiles(e.dataTransfer.files)}}
        className={`border-2 border-dashed rounded p-6 text-center ${dragOver? 'border-black bg-gray-50':'border-gray-300'}`}
      >
        <div className="mb-2 font-medium">Drag & drop images here</div>
        <div className="text-sm text-gray-600 mb-4">JPEG, PNG, WebP • Up to 15MB</div>
        <button onClick={()=>inputRef.current?.click()} className="px-4 py-2 border rounded">Choose Files</button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>handleFiles(e.target.files)} />
      </div>
      {uploading && <div className="mt-2 text-sm">Uploading…</div>}
    </div>
  )
}
