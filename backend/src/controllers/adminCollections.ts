import { Request, Response } from 'express'
import { supabaseAdmin } from '@/utils/supabase'

function slugify(s: string) {
  return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'')
}

export const listCollections = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const createCollection = async (req: Request, res: Response) => {
  try {
    const b = req.body || {}
    const row: any = {
      name: b.name,
      slug: b.slug || slugify(b.name||''),
      description: b.description || null,
      image_url: b.image_url || b.image || null,
      is_featured: !!b.is_featured,
      is_active: b.is_active !== false,
      sort_order: Number(b.sort_order||0),
      start_date: b.start_date || null,
      end_date: b.end_date || null,
      seo_title: b.seo_title || null,
      seo_description: b.seo_description || null
    }
    const { data, error } = await supabaseAdmin.from('collections').insert(row).select('*').single()
    if (error) throw error
    return res.status(201).json({ success: true, data })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const getCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { data, error } = await supabaseAdmin.from('collections').select('*').eq('id', id).single()
    if (error) throw error
    // fetch products mapping
    const { data: prodMap } = await supabaseAdmin.from('product_collections').select('product_id, sort_order').eq('collection_id', id).order('sort_order', { ascending: true })
    return res.status(200).json({ success: true, data: { ...data, products: prodMap||[] } })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const b = req.body || {}
    const updates: any = { ...b }
    delete updates.banner_url // tolerate DBs without this column
    if (b.name && !b.slug) updates.slug = slugify(b.name)
    const { data, error } = await supabaseAdmin.from('collections').update(updates).eq('id', id).select('*').single()
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    await supabaseAdmin.from('product_collections').delete().eq('collection_id', id)
    const { error } = await supabaseAdmin.from('collections').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const addProductsToCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { productIds } = req.body as any
    if (!Array.isArray(productIds)) return res.status(400).json({ success: false, message: 'productIds[] required' })
    // get current max sort
    const { data: existing } = await supabaseAdmin.from('product_collections').select('sort_order').eq('collection_id', id).order('sort_order', { ascending: false }).limit(1)
    let start = existing && existing[0] ? Number(existing[0].sort_order||0) + 1 : 1
    const rows = productIds.map((pid:string, idx:number)=> ({ product_id: pid, collection_id: id, sort_order: start+idx }))
    const { error } = await supabaseAdmin.from('product_collections').upsert(rows)
    if (error) throw error
    // Update products.collection with first collection name for storefront compatibility if needed
    const { data: col } = await supabaseAdmin.from('collections').select('name').eq('id', id).single()
    if (col?.name) { await supabaseAdmin.from('products').update({ collection: col.name }).in('id', productIds) }
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const removeProductFromCollection = async (req: Request, res: Response) => {
  try {
    const { id, productId } = req.params as any
    const { error } = await supabaseAdmin.from('product_collections').delete().match({ collection_id: id, product_id: productId })
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const reorderCollectionProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { orders } = req.body as any
    if (!Array.isArray(orders)) return res.status(400).json({ success: false, message: 'orders[] required' })
    for (const o of orders) {
      await supabaseAdmin.from('product_collections').update({ sort_order: Number(o.sort_order||0) }).match({ collection_id: id, product_id: o.product_id })
    }
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}

export const assignCollections = async (req: Request, res: Response) => {
  try {
    const { productId, collectionIds } = req.body as any
    if (!productId || !Array.isArray(collectionIds)) return res.status(400).json({ success: false, message: 'productId and collectionIds[] required' })
    await supabaseAdmin.from('product_collections').delete().eq('product_id', productId)
    if (collectionIds.length) {
      const rows = collectionIds.map((cid:string, idx:number)=> ({ product_id: productId, collection_id: cid, sort_order: idx+1 }))
      await supabaseAdmin.from('product_collections').insert(rows)
      const { data: c } = await supabaseAdmin.from('collections').select('name').eq('id', collectionIds[0]).single()
      if (c?.name) { await supabaseAdmin.from('products').update({ collection: c.name }).eq('id', productId) }
    } else {
      await supabaseAdmin.from('products').update({ collection: null }).eq('id', productId)
    }
    return res.status(200).json({ success: true })
  } catch (e:any) { return res.status(500).json({ success: false, message: e.message }) }
}
