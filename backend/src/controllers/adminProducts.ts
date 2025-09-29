import { Request, Response } from 'express'
import { supabaseAdmin } from '@/utils/supabase'

function canWrite(role: string) {
  return ['master', 'product_manager', 'marketing'].includes(role)
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export const listProducts = async (req: Request, res: Response) => {
  try {
    const { q, status, sort = 'createdAt_desc', limit = '50', offset = '0' } = req.query as any
    let query = supabaseAdmin.from('products').select('*', { count: 'exact' })
    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    if (status) query = query.eq('status', status)
    const [field, dir] = String(sort).split('_')
    const fieldMap: any = { createdAt: 'createdAt', price: 'price', rating: 'rating', name: 'name' }
    const f = fieldMap[field] || 'createdAt'
    query = query.order(f, { ascending: dir === 'asc' })
    const from = Number(offset)
    const to = from + Number(limit) - 1
    const { data, error, count } = await query.range(from, to)
    if (error) throw error
    return res.status(200).json({ success: true, data, count })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any
    const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, message: 'Not found' })
    return res.status(200).json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const createProduct = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin
    if (!admin || !canWrite(admin.role)) return res.status(403).json({ success: false, message: 'Forbidden' })
    const body = req.body || {}

    // 1) Insert minimal, schema-agnostic fields present in both camelCase and snake_case DBs
    const minimal: any = {
      name: body.name,
      slug: body.slug || toSlug(body.name || ''),
      brand: body.brand || null,
      price: Number(body.price || 0),
      images: Array.isArray(body.images) ? body.images : [],
      description: body.description || null,
      category: body.category || null,
      collection: body.collection || null,
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      status: body.status || 'active',
      sku: body.sku || null,
    }

    let ins = await supabaseAdmin.from('products').insert(minimal).select('*').single()
    if (ins.error) {
      // As a last resort, try snake_case for minimal set too
      const minimalSnake: any = {
        name: minimal.name,
        slug: minimal.slug,
        brand: minimal.brand,
        price: minimal.price,
        images: minimal.images,
        description: minimal.description,
        category: minimal.category,
        collection: minimal.collection,
        sizes: minimal.sizes,
        colors: minimal.colors,
        tags: minimal.tags,
        status: minimal.status,
        sku: minimal.sku,
      }
      ins = await supabaseAdmin.from('products').insert(minimalSnake).select('*').single()
      if (ins.error) throw ins.error
    }

    const newId = (ins.data as any)?.id

    // 2) Update optional fields using robust update that falls back if needed
  const optionalUpdates: any = {}
  if (body.originalPrice != null) optionalUpdates.originalPrice = Number(body.originalPrice)
  if (body.inStock != null) optionalUpdates.inStock = !!body.inStock
  if (body.stockQuantity != null) optionalUpdates.stockQuantity = Number(body.stockQuantity)
  if (body.rating != null) optionalUpdates.rating = Number(body.rating)
  if (body.reviews != null) optionalUpdates.reviews = Number(body.reviews)
  if (body.isNew != null) optionalUpdates.isNew = !!body.isNew
  if (body.isBestSeller != null) optionalUpdates.isBestSeller = !!body.isBestSeller
  if (body.isOnSale != null) optionalUpdates.isOnSale = !!body.isOnSale
  if (body.isFeatured != null) optionalUpdates.isFeatured = !!body.isFeatured

  // Quality-focused fields
  if (body.fabricComposition != null) optionalUpdates.fabric_composition = body.fabricComposition
  if (body.threadCount != null) optionalUpdates.thread_count = Number(body.threadCount)
  if (body.fabricWeight != null) optionalUpdates.fabric_weight = Number(body.fabricWeight)
  if (body.durabilityScore != null) optionalUpdates.durability_score = Number(body.durabilityScore)
  if (body.stretchLevel != null) optionalUpdates.stretch_level = body.stretchLevel
  if (body.careInstructions != null) optionalUpdates.care_instructions = body.careInstructions
  if (body.qualityGrade != null) optionalUpdates.quality_grade = body.qualityGrade
  if (body.sustainabilityRating != null) optionalUpdates.sustainability_rating = body.sustainabilityRating
  if (body.breathabilityRating != null) optionalUpdates.breathability_rating = Number(body.breathabilityRating)
  if (body.fabricOrigin != null) optionalUpdates.fabric_origin = body.fabricOrigin
  if (body.manufacturingLocation != null) optionalUpdates.manufacturing_location = body.manufacturingLocation
  if (body.certifications != null) optionalUpdates.certifications = body.certifications
  if (body.fitType != null) optionalUpdates.fit_type = body.fitType
  if (body.seasonalCollection != null) optionalUpdates.seasonal_collection = body.seasonalCollection
  if (body.lifestyleTags != null) optionalUpdates.lifestyle_tags = body.lifestyleTags
  if (body.recommendedFor != null) optionalUpdates.recommended_for = body.recommendedFor

    if (newId && Object.keys(optionalUpdates).length) {
      // Try camelCase update first
      let upd = await supabaseAdmin.from('products').update(optionalUpdates).eq('id', newId).select('*').single()
      if (upd.error) {
        const map: any = {
          originalPrice: 'original_price',
          inStock: 'in_stock',
          stockQuantity: 'stock_quantity',
          isNew: 'is_new',
          isBestSeller: 'is_best_seller',
          isOnSale: 'is_on_sale',
          isFeatured: 'is_featured',
          // Quality-focused field mappings (these are already snake_case in the DB)
          fabricComposition: 'fabric_composition',
          threadCount: 'thread_count',
          fabricWeight: 'fabric_weight',
          durabilityScore: 'durability_score',
          stretchLevel: 'stretch_level',
          careInstructions: 'care_instructions',
          qualityGrade: 'quality_grade',
          sustainabilityRating: 'sustainability_rating',
          breathabilityRating: 'breathability_rating',
          fabricOrigin: 'fabric_origin',
          manufacturingLocation: 'manufacturing_location',
          certifications: 'certifications',
          fitType: 'fit_type',
          seasonalCollection: 'seasonal_collection',
          lifestyleTags: 'lifestyle_tags',
          recommendedFor: 'recommended_for',
        }
        const snake: any = {}
        for (const k of Object.keys(optionalUpdates)) snake[map[k] || k] = optionalUpdates[k]
        const upd2 = await supabaseAdmin.from('products').update(snake).eq('id', newId).select('*').single()
        if (upd2.error) {
          // If even fallback fails, log but do not block product creation
          // eslint-disable-next-line no-console
          console.warn('[adminProducts] optional updates failed', upd.error?.message || upd.error, upd2.error?.message || upd2.error)
        } else {
          ins.data = upd2.data
        }
      } else {
        ins.data = upd.data
      }
    }

    return res.status(201).json({ success: true, data: ins.data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin
    if (!admin || !canWrite(admin.role)) return res.status(403).json({ success: false, message: 'Forbidden' })
    const { id } = req.params as any
    const body = req.body || {}
    const updates: any = { ...body }
    if (body.name && !body.slug) updates.slug = toSlug(body.name)
    // Try camelCase update
    let upd = await supabaseAdmin.from('products').update(updates).eq('id', id).select('*').single()
    const umsg = String(upd.error?.message || upd.error?.details || '')
    const camelColumnsU = ['originalPrice','inStock','stockQuantity','isNew','isBestSeller','isOnSale','isFeatured',
                          'fabricComposition','threadCount','fabricWeight','durabilityScore','stretchLevel',
                          'careInstructions','qualityGrade','sustainabilityRating','breathabilityRating',
                          'fabricOrigin','manufacturingLocation','certifications','fitType',
                          'seasonalCollection','lifestyleTags','recommendedFor']
    const shouldFallbackU = !!upd.error && camelColumnsU.some(k => umsg.includes(k))
    if (shouldFallbackU) {
      // Fallback to snake_case mapping
      const map: any = {
        originalPrice: 'original_price',
        inStock: 'in_stock',
        stockQuantity: 'stock_quantity',
        isNew: 'is_new',
        isBestSeller: 'is_best_seller',
        isOnSale: 'is_on_sale',
        isFeatured: 'is_featured',
        // Quality-focused field mappings
        fabricComposition: 'fabric_composition',
        threadCount: 'thread_count',
        fabricWeight: 'fabric_weight',
        durabilityScore: 'durability_score',
        stretchLevel: 'stretch_level',
        careInstructions: 'care_instructions',
        qualityGrade: 'quality_grade',
        sustainabilityRating: 'sustainability_rating',
        breathabilityRating: 'breathability_rating',
        fabricOrigin: 'fabric_origin',
        manufacturingLocation: 'manufacturing_location',
        certifications: 'certifications',
        fitType: 'fit_type',
        seasonalCollection: 'seasonal_collection',
        lifestyleTags: 'lifestyle_tags',
        recommendedFor: 'recommended_for',
      }
      const snake: any = {}
      for (const k of Object.keys(updates)) {
        const nk = (map as any)[k] || k
        snake[nk] = updates[k]
      }
      upd = await supabaseAdmin.from('products').update(snake).eq('id', id).select('*').single()
      if (upd.error) throw upd.error
    } else if (upd.error) {
      throw upd.error
    }
    return res.status(200).json({ success: true, data: upd.data })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin
    if (!admin || admin.role === 'viewer' || admin.role === 'marketing') return res.status(403).json({ success: false, message: 'Forbidden' })
    const { id } = req.params as any
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const bulkDelete = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin
    if (!admin || admin.role === 'viewer' || admin.role === 'marketing') return res.status(403).json({ success: false, message: 'Forbidden' })
    const { ids } = req.body as any
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids required' })
    const { error } = await supabaseAdmin.from('products').delete().in('id', ids)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message })
  }
}
