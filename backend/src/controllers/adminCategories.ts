import { Request, Response } from 'express'
import { supabaseAdmin } from '@/utils/supabase'

function slugify(s: string) {
  return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'')
}

export const listCategories = async (req: Request, res: Response) => {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    // build tree
    const byId: any = {}
    rows?.forEach(r=> byId[r.id] = { ...r, children: [] })
    const root: any[] = []
    rows?.forEach(r=> {
      if (r.parent_id && byId[r.parent_id]) byId[r.parent_id].children.push(byId[r.id])
      else root.push(byId[r.id])
    })
    return res.status(200).json({ success: true, data: root })
  } catch (e: any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const createCategory = async (req: Request, res: Response) => {
  try {
    const b = req.body || {}
    const row = {
      name: b.name,
      slug: b.slug || slugify(b.name||''),
      description: b.description || null,
      image_url: b.image_url || null,
      parent_id: b.parent_id || null,
      sort_order: Number(b.sort_order||0),
      is_active: b.is_active !== false,
      seo_title: b.seo_title || null,
      seo_description: b.seo_description || null
    }
    const { data, error } = await supabaseAdmin.from('categories').insert(row).select('*').single()
    if (error) throw error
    return res.status(201).json({ success: true, data })
  } catch (e: any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { data, error } = await supabaseAdmin.from('categories').select('*').eq('id', id).single()
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const b = req.body || {}
    const updates: any = { ...b }
    if (b.name && !b.slug) updates.slug = slugify(b.name)
    const { data, error } = await supabaseAdmin.from('categories').update(updates).eq('id', id).select('*').single()
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { count } = await supabaseAdmin.from('product_categories').select('*', { count: 'exact', head: true }).eq('category_id', id)
    if ((count||0) > 0) return res.status(400).json({ success: false, message: 'Category not empty' })
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const reorderCategories = async (req: Request, res: Response) => {
  try {
    const { orders } = req.body as any
    if (!Array.isArray(orders)) return res.status(400).json({ success: false, message: 'orders[] required' })
    for (const o of orders) {
      await supabaseAdmin.from('categories').update({ sort_order: Number(o.sort_order||0) }).eq('id', o.id)
    }
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const assignCategories = async (req: Request, res: Response) => {
  try {
    const { productId, categoryIds } = req.body as any
    if (!productId || !Array.isArray(categoryIds)) return res.status(400).json({ success: false, message: 'productId and categoryIds[] required' })
    // remove existing
    await supabaseAdmin.from('product_categories').delete().eq('product_id', productId)
    // insert new
    if (categoryIds.length) {
      const rows = categoryIds.map((cid:string)=> ({ product_id: productId, category_id: cid }))
      await supabaseAdmin.from('product_categories').insert(rows)
      // also update products.category with first selected name for storefront compatibility
      const { data: c } = await supabaseAdmin.from('categories').select('name').eq('id', categoryIds[0]).single()
      if (c?.name) { await supabaseAdmin.from('products').update({ category: c.name }).eq('id', productId) }
    } else {
      await supabaseAdmin.from('products').update({ category: null }).eq('id', productId)
    }
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}
