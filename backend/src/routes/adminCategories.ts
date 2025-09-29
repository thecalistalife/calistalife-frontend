import { Router } from 'express'
import { requireAdmin } from '@/middleware/admin'
import { listCategories, createCategory, getCategory, updateCategory, deleteCategory, reorderCategories, assignCategories } from '@/controllers/adminCategories'

const router = Router()

router.use(requireAdmin)
router.get('/', listCategories)
router.post('/', createCategory)
router.get('/:id', getCategory)
router.put('/:id', updateCategory)
router.delete('/:id', deleteCategory)
router.post('/reorder', reorderCategories)
router.post('/assign', assignCategories)

export default router
