import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import crypto from 'crypto'
import { supabaseAdmin } from '@/utils/supabase'

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } })

function namePart() {
  return crypto.randomBytes(8).toString('hex')
}

async function uploadBuffer(bucket: string, path: string, buf: Buffer, contentType: string) {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buf, { contentType, upsert: false })
  if (error) throw error
  const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return pub.publicUrl
}

export const mediaUpload = [
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const productId = (req.body.productId || '').trim()
      if (!productId) return res.status(400).json({ success: false, message: 'productId required' })
      if (!req.file) return res.status(400).json({ success: false, message: 'file required' })

      const bucket = 'products'
      const base = `${productId}/${Date.now()}-${namePart()}`
      const contentType = req.file.mimetype || 'image/jpeg'

      // Generate sizes
      const img = sharp(req.file.buffer).rotate()
      const large = await img.clone().resize(1600, 1600, { fit: 'inside' }).jpeg({ quality: 82 }).toBuffer()
      const medium = await img.clone().resize(800, 800, { fit: 'inside' }).jpeg({ quality: 82 }).toBuffer()
      const thumb = await img.clone().resize(300, 300, { fit: 'cover' }).jpeg({ quality: 80 }).toBuffer()

      const largeUrl = await uploadBuffer(bucket, `${base}-lg.jpg`, large, 'image/jpeg')
      const mediumUrl = await uploadBuffer(bucket, `${base}-md.jpg`, medium, 'image/jpeg')
      const thumbUrl = await uploadBuffer(bucket, `${base}-sm.jpg`, thumb, 'image/jpeg')

      // Save record
      const { data: row, error } = await supabaseAdmin
        .from('product_images')
        .insert({ product_id: productId, url: largeUrl, meta: { mediumUrl, thumbUrl } })
        .select('*')
        .single()
      if (error) throw error

      return res.status(201).json({ success: true, data: { id: row.id, url: largeUrl, mediumUrl, thumbUrl } })
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message })
    }
  }
]

export const listImages = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query as any
    if (!productId) return res.status(400).json({ success: false, message: 'productId required' })
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const updateImageMeta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { alt, is_primary, sort_order } = req.body as any
    const updates: any = {}
    if (alt !== undefined) updates.alt = String(alt)
    if (is_primary !== undefined) updates.is_primary = !!is_primary
    if (sort_order !== undefined) updates.sort_order = Number(sort_order)
    const { error } = await supabaseAdmin.from('product_images').update(updates).eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { data: img, error: selErr } = await supabaseAdmin.from('product_images').select('*').eq('id', id).single()
    if (selErr) throw selErr
    if (img?.url) {
      try {
        const u = new URL(img.url)
        const path = decodeURIComponent(u.pathname.replace(/^\/storage\/v1\/object\/public\/products\//, ''))
        await supabaseAdmin.storage.from('products').remove([path])
      } catch {}
    }
    const { error } = await supabaseAdmin.from('product_images').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}
