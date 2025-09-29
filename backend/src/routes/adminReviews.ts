import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { requireAdmin } from '@/middleware/admin'
import { handleValidationErrors } from '@/middleware'
import { supabaseAdmin } from '@/utils/supabase'

const router = Router()

// List reviews (admin)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string)||'1',10))
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string)||'20',10)))
    const from = (page-1)*limit
    const to = from+limit-1
    const { data, error } = await supabaseAdmin.from('product_reviews').select('*').order('created_at',{ascending:false}).range(from,to)
    if (error) throw error
    res.status(200).json({ success: true, data })
  } catch (err) { next(err) }
})

// Approve / hide review
router.patch('/:id/approval', requireAdmin, body('isApproved').isBoolean(), handleValidationErrors, async (req,res,next)=>{
  try {
    const { id } = req.params as any
    const { isApproved } = req.body as any
    const { error } = await supabaseAdmin.from('product_reviews').update({ is_approved: !!isApproved }).eq('id', id)
    if (error) throw error
    res.status(200).json({ success: true })
  } catch (err) { next(err) }
})

// Delete review
router.delete('/:id', requireAdmin, async (req,res,next)=>{
  try {
    const { id } = req.params as any
    const { error } = await supabaseAdmin.from('product_reviews').delete().eq('id', id)
    if (error) throw error
    res.status(200).json({ success: true })
  } catch (err) { next(err) }
})

// Add official response
router.post('/:id/respond', requireAdmin, body('responseText').isString().isLength({min:2}), handleValidationErrors, async (req,res,next)=>{
  try {
    const { id } = req.params as any
    const { responseText } = req.body as any
    const { data, error } = await supabaseAdmin.from('review_responses').insert({ review_id: id, response_text: responseText }).select('*').single()
    if (error) throw error
    res.status(200).json({ success: true, data })
  } catch (err) { next(err) }
})

export default router
