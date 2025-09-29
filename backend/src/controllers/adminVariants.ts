import { Request, Response } from 'express'
import { supabaseAdmin } from '@/utils/supabase'

export const listVariants = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query as any
    if (!productId) return res.status(400).json({ success: false, message: 'productId required' })
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const upsertVariants = async (req: Request, res: Response) => {
  try {
    const { productId, variants } = req.body as any
    if (!productId || !Array.isArray(variants)) return res.status(400).json({ success: false, message: 'productId and variants[] required' })

    // Delete removed ones if idsToDelete provided
    const idsToDelete: string[] = req.body.idsToDelete || []
    if (idsToDelete.length) {
      await supabaseAdmin.from('product_variants').delete().in('id', idsToDelete)
    }

    // Upsert (insert or update by id)
    const rows = variants.map((v: any) => ({
      id: v.id || undefined,
      product_id: productId,
      size: v.size || null,
      color: v.color || null,
      material: v.material || null,
      sku: v.sku || null,
      stock_quantity: Number(v.stock_quantity || 0),
      price_adjustment: Number(v.price_adjustment || 0),
      image_url: v.image_url || null,
    }))

    const inserts = rows.filter((r: any) => !r.id)
    const updates = rows.filter((r: any) => r.id)

    if (inserts.length) {
      const { error } = await supabaseAdmin.from('product_variants').insert(inserts)
      if (error) throw error
    }
    for (const u of updates) {
      const { id, ...rest } = u
      const { error } = await supabaseAdmin.from('product_variants').update(rest).eq('id', id)
      if (error) throw error
    }

    return res.status(200).json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const deleteVariant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { error } = await supabaseAdmin.from('product_variants').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}
