import { Router } from 'express'
import { requireAdmin } from '@/middleware/admin'
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, bulkDelete } from '@/controllers/adminProducts'

const router = Router()

router.use(requireAdmin)
router.get('/', listProducts)
router.get('/:id', getProduct)
router.post('/', createProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)
router.post('/bulk-delete', bulkDelete)

export default router
