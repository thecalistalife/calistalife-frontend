import { Router } from 'express'
import { requireAdmin } from '@/middleware/admin'
import { listVariants, upsertVariants, deleteVariant } from '@/controllers/adminVariants'

const router = Router()

router.use(requireAdmin)
router.get('/', listVariants)
router.post('/upsert', upsertVariants)
router.delete('/:id', deleteVariant)

export default router
